<?php

declare(strict_types=1);

namespace DarkSlide\Reader;

use DarkSlide\Helpers\Emu;
use RuntimeException;
use SimpleXMLElement;
use ZipArchive;

/**
 * @phpstan-type Slide array<string, mixed>
 */

/**
 * Best-effort PPTX → Deck reader. Extracts text, image, shape, and
 * (v0.3+) table elements with their geometry; preserves slide notes;
 * preserves gradient + solid backgrounds; reconstructs **bold** /
 * *italic* / `code` markdown spans from drawingML runs; emits embedded
 * image bytes as data URIs. Ignores parts of the PPTX surface we can't
 * represent in the Deck schema (animations, complex masters, embedded
 * fonts, etc.).
 *
 * Agent-emitted decks from DarkSlide round-trip with high fidelity;
 * hand-authored PowerPoint files may drop styling we don't model.
 */
final class PptxReader
{
    private const NS_A = 'http://schemas.openxmlformats.org/drawingml/2006/main';
    private const NS_P = 'http://schemas.openxmlformats.org/presentationml/2006/main';
    private const NS_R = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';

    /** Current slide's relationships, keyed by rId -> ['type' => ..., 'target' => ...]. */
    private array $currentSlideRels = [];

    /** ZipArchive being read; held during a single read() call so parsePic can resolve media. */
    private ?ZipArchive $currentZip = null;

    /**
     * @return array<string, mixed>
     */
    public function read(string $path): array
    {
        if (!is_file($path)) {
            throw new RuntimeException("File not found: {$path}");
        }
        $bytes = file_get_contents($path);
        if ($bytes === false) {
            throw new RuntimeException("Could not read file: {$path}");
        }

        return $this->fromBytes($bytes);
    }

    /**
     * @return array<string, mixed>
     */
    public function fromBytes(string $bytes): array
    {
        $tmp = rtrim(sys_get_temp_dir(), DIRECTORY_SEPARATOR)
            . DIRECTORY_SEPARATOR
            . 'dark-slide-read-' . bin2hex(random_bytes(8));
        file_put_contents($tmp, $bytes);

        $zip = new ZipArchive();
        if ($zip->open($tmp) !== true) {
            @unlink($tmp);
            throw new RuntimeException('Could not open zip archive.');
        }

        try {
            $this->currentZip = $zip;
            $deck = $this->extract($zip);
        } finally {
            $this->currentZip = null;
            $zip->close();
            @unlink($tmp);
        }

        return $deck;
    }

    /**
     * @return array<string, mixed>
     */
    private function extract(ZipArchive $zip): array
    {
        $deck = [
            'id' => 'imported-' . dechex(time() & 0xFFFFFF),
            'title' => $this->readCoreTitle($zip) ?? 'Imported',
            'theme' => ['name' => 'imported'],
            'slides' => [],
        ];

        // Walk the presentation rel list in order to find slide ids.
        $presentationRels = $zip->getFromName('ppt/_rels/presentation.xml.rels');
        if ($presentationRels === false) {
            return $deck;
        }
        $slideTargets = $this->extractSlideTargets($presentationRels);

        foreach ($slideTargets as $i => $slideTarget) {
            $slideXml = $zip->getFromName('ppt/' . $slideTarget);
            if ($slideXml === false) {
                continue;
            }
            $slideRels = $zip->getFromName('ppt/' . dirname($slideTarget) . '/_rels/' . basename($slideTarget) . '.rels') ?: '';
            $notes = $this->readNotesFor($zip, $slideRels);
            $this->currentSlideRels = $this->parseSlideRels($slideRels, $slideTarget);

            $slide = $this->parseSlide($slideXml, 'imported-slide-' . ($i + 1), $notes);
            $deck['slides'][] = $slide;
        }

        return $deck;
    }

    /**
     * Parse a slide's `_rels/slideN.xml.rels` into a flat map keyed by rId.
     * Targets are normalized to absolute paths in the zip ("ppt/media/imageN.png").
     *
     * @return array<string, array{type: string, target: string}>
     */
    private function parseSlideRels(string $relsXml, string $slideTargetRelative): array
    {
        if ($relsXml === '') {
            return [];
        }
        $sx = @simplexml_load_string($relsXml);
        if ($sx === false) {
            return [];
        }
        $ns = $sx->getNamespaces(true);
        $default = $ns[''] ?? null;
        if ($default === null) {
            return [];
        }
        $sx->registerXPathNamespace('r', $default);

        // The slide lives at ppt/slides/slideN.xml; its rels resolve relative
        // to ppt/slides/, so "../media/image1.png" → "ppt/media/image1.png".
        $slideDirAbs = 'ppt/' . dirname($slideTargetRelative);
        $rels = [];
        foreach ($sx->xpath('//r:Relationship') ?: [] as $r) {
            $id = (string) $r['Id'];
            $type = (string) $r['Type'];
            $target = (string) $r['Target'];
            $resolved = $this->resolveRelTarget($slideDirAbs, $target);
            $rels[$id] = ['type' => $type, 'target' => $resolved];
        }

        return $rels;
    }

    private function resolveRelTarget(string $baseDir, string $target): string
    {
        if (str_starts_with($target, '/')) {
            return ltrim($target, '/');
        }
        $stack = explode('/', $baseDir);
        foreach (explode('/', $target) as $segment) {
            if ($segment === '..') {
                array_pop($stack);
            } elseif ($segment !== '.' && $segment !== '') {
                $stack[] = $segment;
            }
        }

        return implode('/', $stack);
    }

    /**
     * @return list<string>
     */
    private function extractSlideTargets(string $relsXml): array
    {
        $targets = [];
        $xml = @simplexml_load_string($relsXml);
        if ($xml === false) {
            return [];
        }
        $ns = $xml->getNamespaces(true);
        $default = $ns[''] ?? null;
        if ($default !== null) {
            $xml->registerXPathNamespace('r', $default);
            foreach ($xml->xpath('//r:Relationship') ?: [] as $r) {
                $type = (string) $r['Type'];
                if (str_ends_with($type, '/slide')) {
                    $targets[] = (string) $r['Target'];
                }
            }
        }

        return $targets;
    }

    private function readCoreTitle(ZipArchive $zip): ?string
    {
        $xml = $zip->getFromName('docProps/core.xml');
        if ($xml === false) {
            return null;
        }
        $sx = @simplexml_load_string($xml);
        if ($sx === false) {
            return null;
        }
        $sx->registerXPathNamespace('dc', 'http://purl.org/dc/elements/1.1/');
        $hits = $sx->xpath('//dc:title');
        if (!empty($hits)) {
            return (string) $hits[0];
        }

        return null;
    }

    private function readNotesFor(ZipArchive $zip, string $slideRelsXml): ?string
    {
        if ($slideRelsXml === '') {
            return null;
        }
        $sx = @simplexml_load_string($slideRelsXml);
        if ($sx === false) {
            return null;
        }
        $ns = $sx->getNamespaces(true);
        $default = $ns[''] ?? null;
        if ($default === null) {
            return null;
        }
        $sx->registerXPathNamespace('r', $default);
        foreach ($sx->xpath('//r:Relationship') ?: [] as $r) {
            if (str_ends_with((string) $r['Type'], '/notesSlide')) {
                $target = (string) $r['Target'];
                $notesXml = $zip->getFromName('ppt/' . ltrim(str_replace('../', '', $target), '/'));
                if ($notesXml === false) {
                    return null;
                }

                return $this->parseNotesText($notesXml);
            }
        }

        return null;
    }

    private function parseNotesText(string $xml): string
    {
        $sx = @simplexml_load_string($xml);
        if ($sx === false) {
            return '';
        }
        $sx->registerXPathNamespace('a', self::NS_A);
        $parts = [];
        foreach ($sx->xpath('//a:t') ?: [] as $t) {
            $parts[] = (string) $t;
        }

        return implode("\n", $parts);
    }

    /**
     * @return array<string, mixed>
     */
    private function parseSlide(string $xml, string $id, ?string $notes): array
    {
        $slide = [
            'id' => $id,
            'layout' => 'blank',
            'elements' => [],
        ];
        if ($notes !== null && $notes !== '') {
            $slide['notes'] = $notes;
        }

        $sx = @simplexml_load_string($xml);
        if ($sx === false) {
            return $slide;
        }
        $sx->registerXPathNamespace('p', self::NS_P);
        $sx->registerXPathNamespace('a', self::NS_A);

        $bg = $this->parseBackground($sx);
        if ($bg !== null) {
            $slide['background'] = $bg;
        }

        $shapes = $sx->xpath('//p:sp') ?: [];
        foreach ($shapes as $shape) {
            $element = $this->parseShape($shape);
            if ($element !== null) {
                $slide['elements'][] = $element;
            }
        }
        $pics = $sx->xpath('//p:pic') ?: [];
        foreach ($pics as $pic) {
            $element = $this->parsePic($pic);
            if ($element !== null) {
                $slide['elements'][] = $element;
            }
        }
        $graphicFrames = $sx->xpath('//p:graphicFrame') ?: [];
        foreach ($graphicFrames as $gf) {
            $element = $this->parseGraphicFrame($gf);
            if ($element !== null) {
                $slide['elements'][] = $element;
            }
        }

        return $slide;
    }

    /**
     * Extract the slide's background. Recognizes:
     *  - solid fill   → ['color' => '#hex']
     *  - gradient     → ['gradient' => 'linear-gradient(...)']
     *  - blipFill     → ['image' => 'data:...']
     * Returns null when no background is present.
     *
     * @return array<string, mixed>|null
     */
    private function parseBackground(SimpleXMLElement $sx): ?array
    {
        $sx->registerXPathNamespace('p', self::NS_P);
        $sx->registerXPathNamespace('a', self::NS_A);

        $bgPrList = $sx->xpath('//p:bg/p:bgPr');
        if (empty($bgPrList)) {
            return null;
        }
        $bgPr = $bgPrList[0];
        $bgPr->registerXPathNamespace('a', self::NS_A);

        // Solid fill
        $solid = $bgPr->xpath('.//a:solidFill/a:srgbClr');
        if (!empty($solid)) {
            $hex = (string) $solid[0]['val'];
            if ($hex !== '') {
                return ['color' => '#' . $hex];
            }
        }

        // Gradient fill
        $grad = $bgPr->xpath('.//a:gradFill');
        if (!empty($grad)) {
            $css = $this->gradFillToCss($grad[0]);
            if ($css !== null) {
                return ['gradient' => $css];
            }
        }

        // Image (blipFill)
        $blip = $bgPr->xpath('.//a:blipFill/a:blip');
        if (!empty($blip)) {
            $blip[0]->registerXPathNamespace('r', self::NS_R);
            $rid = (string) $blip[0]->attributes(self::NS_R)['embed'];
            if ($rid !== '' && isset($this->currentSlideRels[$rid])) {
                $dataUri = $this->readMediaAsDataUri($this->currentSlideRels[$rid]['target']);
                if ($dataUri !== null) {
                    return ['image' => $dataUri];
                }
            }
        }

        return null;
    }

    /**
     * Convert an `<a:gradFill>` block back to a CSS `linear-gradient(...)`
     * string. Inverts the writer's angle math (PPTX clockwise-from-east
     * 60000ths → CSS clockwise-from-north degrees).
     */
    private function gradFillToCss(SimpleXMLElement $grad): ?string
    {
        $grad->registerXPathNamespace('a', self::NS_A);
        $stops = $grad->xpath('.//a:gs');
        if (empty($stops)) {
            return null;
        }

        $stopStrings = [];
        foreach ($stops as $stop) {
            $pos = (int) $stop['pos']; // 0..100000
            $pct = round($pos / 1000, 1);
            $color = $stop->xpath('.//a:srgbClr');
            if (empty($color)) {
                continue;
            }
            $hex = (string) $color[0]['val'];
            if ($hex === '') {
                continue;
            }
            $stopStrings[] = '#' . strtolower($hex) . ' ' . (string) $pct . '%';
        }
        if (empty($stopStrings)) {
            return null;
        }

        $lin = $grad->xpath('.//a:lin');
        $angle = 180; // CSS default — top to bottom
        if (!empty($lin)) {
            $pptxAng = (int) $lin[0]['ang']; // 60000ths from east
            $deg = ($pptxAng / 60000) + 90;
            $angle = (int) round((($deg % 360) + 360) % 360);
        }

        return 'linear-gradient(' . $angle . 'deg, ' . implode(', ', $stopStrings) . ')';
    }

    /**
     * Resolve an `r:embed` rel → media archive entry → data URI string.
     */
    private function readMediaAsDataUri(string $archivePath): ?string
    {
        if ($this->currentZip === null) {
            return null;
        }
        $bytes = $this->currentZip->getFromName($archivePath);
        if ($bytes === false) {
            return null;
        }
        $mime = $this->guessMimeFromArchivePath($archivePath);

        return 'data:' . $mime . ';base64,' . base64_encode($bytes);
    }

    private function guessMimeFromArchivePath(string $path): string
    {
        $ext = strtolower(pathinfo($path, PATHINFO_EXTENSION));

        return match ($ext) {
            'png' => 'image/png',
            'jpg', 'jpeg' => 'image/jpeg',
            'gif' => 'image/gif',
            'svg' => 'image/svg+xml',
            'webp' => 'image/webp',
            default => 'application/octet-stream',
        };
    }

    /**
     * @return array<string, mixed>|null
     */
    private function parseShape(SimpleXMLElement $sp): ?array
    {
        $sp->registerXPathNamespace('a', self::NS_A);
        $sp->registerXPathNamespace('p', self::NS_P);

        $xfrm = $sp->xpath('.//a:xfrm')[0] ?? null;
        if ($xfrm === null) {
            return null;
        }
        $offset = $xfrm->xpath('a:off')[0] ?? null;
        $extent = $xfrm->xpath('a:ext')[0] ?? null;
        if ($offset === null || $extent === null) {
            return null;
        }
        $x = (int) $offset['x'];
        $y = (int) $offset['y'];
        $cx = (int) $extent['cx'];
        $cy = (int) $extent['cy'];

        $base = [
            'id' => (string) ($sp->xpath('.//p:cNvPr')[0]['name'] ?? 'imported-' . random_int(1000, 9999)),
            'x' => Emu::toFracX($x),
            'y' => Emu::toFracY($y),
            'w' => Emu::toFracX($cx),
            'h' => Emu::toFracY($cy),
        ];

        // Text body present?
        $tBody = $sp->xpath('.//p:txBody')[0] ?? null;
        $paragraphMarkdown = [];
        $anyDecoration = false;
        if ($tBody !== null) {
            $tBody->registerXPathNamespace('a', self::NS_A);
            foreach ($tBody->xpath('.//a:p') ?: [] as $p) {
                $p->registerXPathNamespace('a', self::NS_A);
                [$md, $decorated] = $this->paragraphToMarkdown($p);
                $paragraphMarkdown[] = $md;
                $anyDecoration = $anyDecoration || $decorated;
            }
        }

        // Preset geometry?
        $prst = $sp->xpath('.//a:prstGeom')[0]['prst'] ?? null;
        $prst = $prst !== null ? (string) $prst : null;

        // Heuristic: if there's any text content, treat as text element.
        $hasText = !empty(array_filter($paragraphMarkdown, fn ($t) => $t !== ''));
        if ($hasText) {
            return $base + [
                'type' => 'text',
                'content' => implode("\n", $paragraphMarkdown),
                'format' => $anyDecoration ? 'markdown' : 'plain',
            ];
        }

        // Otherwise, if the shape has a known preset, emit a shape element.
        $shapeKind = match ($prst) {
            'rect' => 'rect',
            'roundRect' => 'rounded-rect',
            'ellipse' => 'ellipse',
            'triangle' => 'triangle',
            'line' => 'line',
            'rightArrow' => 'arrow',
            default => null,
        };
        if ($shapeKind !== null) {
            return $base + ['type' => 'shape', 'shape' => $shapeKind];
        }

        return null;
    }

    /**
     * @return array<string, mixed>|null
     */
    private function parsePic(SimpleXMLElement $pic): ?array
    {
        $pic->registerXPathNamespace('a', self::NS_A);
        $pic->registerXPathNamespace('p', self::NS_P);

        $xfrm = $pic->xpath('.//a:xfrm')[0] ?? null;
        if ($xfrm === null) {
            return null;
        }
        $offset = $xfrm->xpath('a:off')[0] ?? null;
        $extent = $xfrm->xpath('a:ext')[0] ?? null;
        if ($offset === null || $extent === null) {
            return null;
        }

        $src = '';
        $blip = $pic->xpath('.//a:blip');
        if (!empty($blip)) {
            $blip[0]->registerXPathNamespace('r', self::NS_R);
            $rid = (string) $blip[0]->attributes(self::NS_R)['embed'];
            if ($rid !== '' && isset($this->currentSlideRels[$rid])) {
                $dataUri = $this->readMediaAsDataUri($this->currentSlideRels[$rid]['target']);
                if ($dataUri !== null) {
                    $src = $dataUri;
                }
            }
        }

        return [
            'id' => (string) ($pic->xpath('.//p:cNvPr')[0]['name'] ?? 'imported-' . random_int(1000, 9999)),
            'type' => 'image',
            'x' => Emu::toFracX((int) $offset['x']),
            'y' => Emu::toFracY((int) $offset['y']),
            'w' => Emu::toFracX((int) $extent['cx']),
            'h' => Emu::toFracY((int) $extent['cy']),
            'src' => $src,
            'fit' => 'contain',
        ];
    }

    /**
     * Parse a `<p:graphicFrame>` — currently only tables are recognized
     * (drawingML table parts use the `.../drawingml/2006/table` graphicData
     * uri). Anything else returns null so the element is silently dropped.
     *
     * @return array<string, mixed>|null
     */
    private function parseGraphicFrame(SimpleXMLElement $gf): ?array
    {
        $gf->registerXPathNamespace('a', self::NS_A);
        $gf->registerXPathNamespace('p', self::NS_P);

        $xfrm = $gf->xpath('.//p:xfrm')[0] ?? null;
        if ($xfrm === null) {
            return null;
        }
        $offset = $xfrm->xpath('a:off')[0] ?? null;
        $extent = $xfrm->xpath('a:ext')[0] ?? null;
        if ($offset === null || $extent === null) {
            return null;
        }

        $tbl = $gf->xpath('.//a:tbl')[0] ?? null;
        if ($tbl === null) {
            return null;
        }
        $tbl->registerXPathNamespace('a', self::NS_A);

        $rows = $tbl->xpath('.//a:tr') ?: [];
        if (empty($rows)) {
            return null;
        }

        // Header row → columns
        $headerCells = $rows[0]->xpath('.//a:tc') ?: [];
        $columns = [];
        foreach ($headerCells as $i => $cell) {
            $label = $this->cellText($cell);
            $columns[] = [
                'key' => 'col' . ($i + 1),
                'label' => $label,
            ];
        }

        // Body rows
        $bodyRows = [];
        for ($r = 1; $r < count($rows); $r++) {
            $rowCells = $rows[$r]->xpath('.//a:tc') ?: [];
            $rowData = [];
            foreach ($columns as $i => $col) {
                $cell = $rowCells[$i] ?? null;
                if ($cell !== null) {
                    $rowData[$col['key']] = $this->cellText($cell);
                }
            }
            $bodyRows[] = $rowData;
        }

        return [
            'id' => (string) ($gf->xpath('.//p:cNvPr')[0]['name'] ?? 'imported-table-' . random_int(1000, 9999)),
            'type' => 'table',
            'x' => Emu::toFracX((int) $offset['x']),
            'y' => Emu::toFracY((int) $offset['y']),
            'w' => Emu::toFracX((int) $extent['cx']),
            'h' => Emu::toFracY((int) $extent['cy']),
            'columns' => $columns,
            'rows' => $bodyRows,
        ];
    }

    private function cellText(SimpleXMLElement $cell): string
    {
        $cell->registerXPathNamespace('a', self::NS_A);
        $segments = [];
        foreach ($cell->xpath('.//a:t') ?: [] as $t) {
            $segments[] = (string) $t;
        }

        return implode('', $segments);
    }

    /**
     * Convert a drawingML `<a:p>` element back into a single line of
     * markdown source. Returns `[markdownLine, anyDecoration]`. The flag
     * lets the caller decide whether to mark the whole text element as
     * `format=markdown` (we only do so when at least one run carried
     * mixed decoration or the paragraph was a bullet).
     *
     * Heuristic for inline span emission:
     *   - If every non-empty run is bold, we treat bold as the paragraph
     *     default (it was set via the element's `style.weight`) and emit
     *     no `**` markers. Same for italic.
     *   - If runs are mixed (some bold, some not), `**` wraps only the
     *     bold ones — the canonical markdown case.
     *   - Code runs (Consolas / monospace font hint) always wrap in
     *     backticks because that's how the writer encodes them.
     *
     * We intentionally do NOT try to reconstruct `# ATX headings` from
     * run sizes — there's no reliable way to distinguish a hand-styled
     * "large bold title" from a markdown-emitted `#` heading. Round-trip
     * fidelity stops at inline spans.
     *
     * @return array{0: string, 1: bool}
     */
    private function paragraphToMarkdown(SimpleXMLElement $p): array
    {
        $p->registerXPathNamespace('a', self::NS_A);

        // Bullet?
        $bu = $p->xpath('.//a:pPr/a:buChar');
        $isBullet = !empty($bu);

        $runs = $p->xpath('.//a:r') ?: [];
        if (empty($runs)) {
            return [$isBullet ? '- ' : '', $isBullet];
        }

        // First pass: collect (text, b, i, code) tuples + uniformity flags.
        $parsed = [];
        $allBold = true;
        $allItalic = true;
        $anyNonEmpty = false;
        foreach ($runs as $r) {
            $r->registerXPathNamespace('a', self::NS_A);
            $rPr = $r->xpath('a:rPr')[0] ?? null;
            $tNode = $r->xpath('a:t')[0] ?? null;
            $text = $tNode !== null ? (string) $tNode : '';
            $b = false;
            $i = false;
            $code = false;
            if ($rPr !== null) {
                $b = ((string) ($rPr['b'] ?? '0')) === '1';
                $i = ((string) ($rPr['i'] ?? '0')) === '1';
                $latin = $rPr->xpath('a:latin');
                if (!empty($latin)) {
                    $typeface = strtolower((string) $latin[0]['typeface']);
                    if (str_contains($typeface, 'consola') || str_contains($typeface, 'mono') || str_contains($typeface, 'courier')) {
                        $code = true;
                    }
                }
            }
            if ($text !== '') {
                $anyNonEmpty = true;
                if (!$b) {
                    $allBold = false;
                }
                if (!$i) {
                    $allItalic = false;
                }
            }
            $parsed[] = ['text' => $text, 'b' => $b, 'i' => $i, 'code' => $code];
        }
        if (!$anyNonEmpty) {
            return [$isBullet ? '- ' : '', $isBullet];
        }

        // Second pass: emit, treating uniform bold/italic as the
        // paragraph default (no markers).
        $line = '';
        $anyDecoration = false;
        foreach ($parsed as $run) {
            $text = $run['text'];
            $emitBold = $run['b'] && !$allBold;
            $emitItalic = $run['i'] && !$allItalic;
            if ($run['code']) {
                $line .= '`' . $text . '`';
                $anyDecoration = true;
            } elseif ($emitBold && $emitItalic) {
                $line .= '***' . $text . '***';
                $anyDecoration = true;
            } elseif ($emitBold) {
                $line .= '**' . $text . '**';
                $anyDecoration = true;
            } elseif ($emitItalic) {
                $line .= '*' . $text . '*';
                $anyDecoration = true;
            } else {
                $line .= $text;
            }
        }

        if ($isBullet) {
            return ['- ' . $line, true];
        }

        return [$line, $anyDecoration];
    }
}
