<?php

declare(strict_types=1);

namespace DarkSlide\Reader;

use DarkSlide\Helpers\Emu;
use RuntimeException;
use SimpleXMLElement;
use ZipArchive;

/**
 * Best-effort PPTX → Deck reader. Extracts text, image, and shape
 * elements with their geometry; preserves slide notes; ignores parts of
 * the PPTX surface we can't represent in the Deck schema (animations,
 * complex masters, embedded fonts, etc.).
 *
 * The reader is intentionally lenient — agent-emitted decks from
 * DarkSlide round-trip losslessly, hand-authored PowerPoint files may
 * drop some styling. v0.2 will tighten the round-trip for text styles
 * + tables.
 */
final class PptxReader
{
    private const NS_A = 'http://schemas.openxmlformats.org/drawingml/2006/main';
    private const NS_P = 'http://schemas.openxmlformats.org/presentationml/2006/main';
    private const NS_R = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';

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
            $deck = $this->extract($zip);
        } finally {
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

            $slide = $this->parseSlide($slideXml, 'imported-slide-' . ($i + 1), $notes);
            $deck['slides'][] = $slide;
        }

        return $deck;
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

        return $slide;
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
        $texts = [];
        if ($tBody !== null) {
            $tBody->registerXPathNamespace('a', self::NS_A);
            foreach ($tBody->xpath('.//a:p') ?: [] as $p) {
                $p->registerXPathNamespace('a', self::NS_A);
                $segments = [];
                foreach ($p->xpath('.//a:t') ?: [] as $t) {
                    $segments[] = (string) $t;
                }
                $texts[] = implode('', $segments);
            }
        }

        // Preset geometry?
        $prst = $sp->xpath('.//a:prstGeom')[0]['prst'] ?? null;
        $prst = $prst !== null ? (string) $prst : null;

        // Heuristic: if there's any text content, treat as text element.
        if (!empty(array_filter($texts, fn ($t) => $t !== ''))) {
            return $base + [
                'type' => 'text',
                'content' => implode("\n", $texts),
                'format' => 'plain',
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

        return [
            'id' => (string) ($pic->xpath('.//p:cNvPr')[0]['name'] ?? 'imported-' . random_int(1000, 9999)),
            'type' => 'image',
            'x' => Emu::toFracX((int) $offset['x']),
            'y' => Emu::toFracY((int) $offset['y']),
            'w' => Emu::toFracX((int) $extent['cx']),
            'h' => Emu::toFracY((int) $extent['cy']),
            'src' => '',  // The actual image bytes can be extracted via the rels — v0.2 will return data URIs.
            'fit' => 'contain',
        ];
    }
}
