<?php

declare(strict_types=1);

namespace DarkSlide\Writer;

use DarkSlide\Helpers\Color;
use DarkSlide\Helpers\Emu;
use DarkSlide\Helpers\MarkdownInline;
use DarkSlide\Helpers\SyntaxHighlighter;
use DarkSlide\Helpers\Xml;
use DarkSlide\Schema\Schema;
use RuntimeException;
use ZipArchive;

/**
 * @phpstan-consistent-constructor
 *
 * PPTX (Office Open XML) writer. Takes a Deck schema and produces a
 * `.pptx` file PowerPoint / Keynote / Google Slides / LibreOffice
 * Impress can open.
 *
 * The PPTX format is a zip archive of XML parts following ECMA-376. This
 * writer ships the minimal viable set:
 *
 *   [Content_Types].xml
 *   _rels/.rels
 *   docProps/{core, app}.xml
 *   ppt/presentation.xml + _rels
 *   ppt/theme/theme1.xml
 *   ppt/slideMasters/slideMaster1.xml + _rels
 *   ppt/slideLayouts/slideLayout1.xml + _rels
 *   ppt/slides/slideN.xml + _rels (one per deck slide)
 *   ppt/notesSlides/notesSlideN.xml + _rels (one per slide with notes)
 *   ppt/media/imageN.* (referenced by image elements)
 *
 * Coordinates are converted from 0..1 fractions to EMU. Font sizes are
 * stored in hundredths-of-point (24pt → 2400). Colors are 6-digit hex.
 *
 * What gets written per element type:
 *   text   — `<p:sp>` with `<p:txBody>` containing styled paragraphs/runs
 *   image  — `<p:pic>` with the binary embedded as `ppt/media/imageN.*`
 *   shape  — `<p:sp>` with `<a:prstGeom>` preset geometry (rect,
 *            ellipse, triangle, line, arrow; rounded-rect uses rect
 *            with `prstGeom="roundRect"`)
 *   code   — text element with monospace font + dark fill (no syntax
 *            highlighting; v0.2 will render via Pygments/etc.)
 *   chart  — placeholder text "[chart: <kind>]" (v0.2 will emit real
 *            chart parts)
 *   table  — placeholder for v0.1 (v0.2 ships real `<a:tbl>`)
 *   embed  — placeholder text "[embed: <src>]" (no PPTX equivalent)
 */
final class PptxWriter
{
    /** Counter for media file names. Reset per write(). */
    private int $mediaCounter = 0;

    /** Media files queued for the archive, keyed by archive path. */
    private array $mediaFiles = [];

    /**
     * Override the temp directory used while assembling the archive.
     * Defaults to {@see sys_get_temp_dir()}; callers running in
     * sandboxes / containers where that path isn't writable can pass
     * their own (e.g. `storage_path('app/tmp')` in Laravel).
     */
    public function __construct(private ?string $tempDir = null)
    {
    }

    private function resolveTempDir(): string
    {
        $dir = $this->tempDir ?? sys_get_temp_dir();

        return rtrim($dir, DIRECTORY_SEPARATOR);
    }

    /**
     * Write a deck to disk.
     *
     * @param  array<string, mixed>  $deck
     * @return array{path: string, bytes: int, slides: int}
     */
    public function write(array $deck, string $path): array
    {
        $bytes = $this->toBytes($deck);
        $dir = dirname($path);
        if (!is_dir($dir) && !mkdir($dir, 0777, true) && !is_dir($dir)) {
            throw new RuntimeException("Could not create directory: {$dir}");
        }
        $ok = file_put_contents($path, $bytes);
        if ($ok === false) {
            throw new RuntimeException("Could not write file: {$path}");
        }

        return [
            'path' => $path,
            'bytes' => strlen($bytes),
            'slides' => count($deck['slides'] ?? []),
        ];
    }

    /**
     * Build the PPTX archive entirely in memory and return its bytes.
     *
     * @param  array<string, mixed>  $deck
     */
    public function toBytes(array $deck): string
    {
        $this->mediaCounter = 0;
        $this->mediaFiles = [];

        $slides = $deck['slides'] ?? [];
        $slideCount = count($slides);

        // Build the zip in a dedicated per-call subdirectory so ZipArchive's
        // internal scratch file (which it creates next to the target during
        // close()) has a clean place to live. We can't rely on tempnam()
        // because it raises a PHP notice on some platforms that Laravel's
        // HandleExceptions promotes to a fatal ErrorException — even when
        // wrapped with `@`. The temp dir defaults to sys_get_temp_dir()
        // but is overridable via the constructor for hosts where that
        // path isn't writable.
        $base = $this->resolveTempDir();
        $tmpDir = $base . DIRECTORY_SEPARATOR . 'dark-slide-' . bin2hex(random_bytes(8));
        if (!is_dir($tmpDir) && !@mkdir($tmpDir, 0700, true) && !is_dir($tmpDir)) {
            throw new RuntimeException("Could not allocate temp dir for PPTX archive at: {$tmpDir}. Override the temp directory by passing it to the PptxWriter constructor.");
        }
        $tmp = $tmpDir . DIRECTORY_SEPARATOR . 'deck.pptx';

        try {
            $zip = new ZipArchive();
            if ($zip->open($tmp, ZipArchive::OVERWRITE | ZipArchive::CREATE) !== true) {
                throw new RuntimeException('Could not open zip archive for writing.');
            }

            // 1. Stage every text-based part first so we know which media
            //    references to register before [Content_Types].xml is written.
            $slidesXml = [];
            $notesSlidesXml = [];
            foreach ($slides as $i => $slide) {
                $oneBased = $i + 1;
                $slidesXml[$oneBased] = $this->buildSlideXml($slide, $oneBased);
                if (!empty($slide['notes'])) {
                    $notesSlidesXml[$oneBased] = $this->buildNotesSlideXml($slide, $oneBased);
                }
            }

            // 2. Top-level + ppt-level scaffolding.
            $zip->addFromString('[Content_Types].xml', $this->buildContentTypes($slideCount, array_keys($notesSlidesXml)));
            $zip->addFromString('_rels/.rels', $this->buildTopRels());
            $zip->addFromString('docProps/core.xml', $this->buildCoreProps($deck));
            $zip->addFromString('docProps/app.xml', $this->buildAppProps($slideCount));

            $zip->addFromString('ppt/presentation.xml', $this->buildPresentation($slideCount));
            $zip->addFromString('ppt/_rels/presentation.xml.rels', $this->buildPresentationRels($slideCount));

            $zip->addFromString('ppt/theme/theme1.xml', $this->buildTheme($deck));
            $zip->addFromString('ppt/slideMasters/slideMaster1.xml', $this->buildSlideMaster());
            $zip->addFromString('ppt/slideMasters/_rels/slideMaster1.xml.rels', $this->buildSlideMasterRels());
            $zip->addFromString('ppt/slideLayouts/slideLayout1.xml', $this->buildSlideLayout());
            $zip->addFromString('ppt/slideLayouts/_rels/slideLayout1.xml.rels', $this->buildSlideLayoutRels());

            // 3. Slide parts.
            foreach ($slidesXml as $i => $xml) {
                $zip->addFromString("ppt/slides/slide{$i}.xml", $xml);
                $zip->addFromString("ppt/slides/_rels/slide{$i}.xml.rels", $this->buildSlideRels($i, isset($notesSlidesXml[$i])));
            }

            // 4. Notes slide parts (only for slides with notes).
            foreach ($notesSlidesXml as $i => $xml) {
                $zip->addFromString("ppt/notesSlides/notesSlide{$i}.xml", $xml);
                $zip->addFromString("ppt/notesSlides/_rels/notesSlide{$i}.xml.rels", $this->buildNotesSlideRels($i));
            }

            // 5. Embedded media files.
            foreach ($this->mediaFiles as $archivePath => $bytes) {
                $zip->addFromString($archivePath, $bytes);
            }

            $zip->close();

            $contents = file_get_contents($tmp);
            if ($contents === false) {
                throw new RuntimeException('Could not read assembled PPTX archive.');
            }

            return $contents;
        } finally {
            @unlink($tmp);
            @rmdir($tmpDir);
        }
    }

    // ─── Top-level parts ───────────────────────────────────────────────────

    private function buildContentTypes(int $slideCount, array $notesSlideIds): string
    {
        $slideOverrides = '';
        for ($i = 1; $i <= $slideCount; $i++) {
            $slideOverrides .= '<Override PartName="/ppt/slides/slide' . $i . '.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>';
        }
        $notesOverrides = '';
        foreach ($notesSlideIds as $i) {
            $notesOverrides .= '<Override PartName="/ppt/notesSlides/notesSlide' . $i . '.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.notesSlide+xml"/>';
        }

        // Extension defaults — covers our embedded image media. PNG / JPEG
        // are the common cases; SVG and GIF are added defensively for
        // agent-emitted decks that reference data URIs of those types.
        $extensionDefaults = '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
            . '<Default Extension="xml" ContentType="application/xml"/>'
            . '<Default Extension="png" ContentType="image/png"/>'
            . '<Default Extension="jpg" ContentType="image/jpeg"/>'
            . '<Default Extension="jpeg" ContentType="image/jpeg"/>'
            . '<Default Extension="gif" ContentType="image/gif"/>'
            . '<Default Extension="svg" ContentType="image/svg+xml"/>'
            . '<Default Extension="webp" ContentType="image/webp"/>';

        return Xml::declaration()
            . '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
            . $extensionDefaults
            . '<Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>'
            . '<Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/>'
            . '<Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>'
            . '<Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>'
            . $slideOverrides
            . $notesOverrides
            . '<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>'
            . '<Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>'
            . '</Types>';
    }

    private function buildTopRels(): string
    {
        return Xml::declaration()
            . '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
            . '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>'
            . '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>'
            . '<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>'
            . '</Relationships>';
    }

    /** @param array<string, mixed> $deck */
    private function buildCoreProps(array $deck): string
    {
        $title = Xml::text((string) ($deck['title'] ?? 'Untitled'));
        $author = isset($deck['metadata']['author']) ? Xml::text((string) $deck['metadata']['author']) : 'Dark Slide';
        $now = gmdate('Y-m-d\TH:i:s\Z');

        return Xml::declaration()
            . '<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">'
            . "<dc:title>{$title}</dc:title>"
            . "<dc:creator>{$author}</dc:creator>"
            . "<cp:lastModifiedBy>{$author}</cp:lastModifiedBy>"
            . "<dcterms:created xsi:type=\"dcterms:W3CDTF\">{$now}</dcterms:created>"
            . "<dcterms:modified xsi:type=\"dcterms:W3CDTF\">{$now}</dcterms:modified>"
            . '</cp:coreProperties>';
    }

    private function buildAppProps(int $slideCount): string
    {
        return Xml::declaration()
            . '<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">'
            . '<Application>DarkSlide</Application>'
            . '<AppVersion>0.3.0</AppVersion>'
            . "<Slides>{$slideCount}</Slides>"
            . '</Properties>';
    }

    // ─── presentation.xml ──────────────────────────────────────────────────

    private function buildPresentation(int $slideCount): string
    {
        $sldIdLst = '';
        for ($i = 1; $i <= $slideCount; $i++) {
            // Slide ids must be >= 256. We start at 256 and increment.
            $id = 256 + ($i - 1);
            $sldIdLst .= '<p:sldId id="' . $id . '" r:id="rId' . ($i + 1) . '"/>';
        }
        $slideMasterRid = 'rId' . ($slideCount + 2);

        return Xml::declaration()
            . '<p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" '
            . 'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" '
            . 'xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" '
            . 'saveSubsetFonts="1">'
            . '<p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="' . $slideMasterRid . '"/></p:sldMasterIdLst>'
            . '<p:sldIdLst>' . $sldIdLst . '</p:sldIdLst>'
            . '<p:sldSz cx="' . Emu::DEFAULT_SLIDE_WIDTH . '" cy="' . Emu::DEFAULT_SLIDE_HEIGHT . '" type="screen16x9"/>'
            . '<p:notesSz cx="' . Emu::DEFAULT_SLIDE_HEIGHT . '" cy="' . Emu::DEFAULT_SLIDE_WIDTH . '"/>'
            . '</p:presentation>';
    }

    private function buildPresentationRels(int $slideCount): string
    {
        $rels = '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="theme/theme1.xml"/>';
        for ($i = 1; $i <= $slideCount; $i++) {
            $rels .= '<Relationship Id="rId' . ($i + 1) . '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide' . $i . '.xml"/>';
        }
        $rels .= '<Relationship Id="rId' . ($slideCount + 2) . '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="slideMasters/slideMaster1.xml"/>';

        return Xml::declaration()
            . '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
            . $rels
            . '</Relationships>';
    }

    // ─── theme / master / layout (single set, reused across all slides) ───

    /** @param array<string, mixed> $deck */
    private function buildTheme(array $deck): string
    {
        $colors = (array) ($deck['theme']['colors'] ?? []);
        [$bg, ] = Color::parse($colors['background'] ?? '#FFFFFF', 'FFFFFF');
        [$text, ] = Color::parse($colors['text'] ?? '#0F172A', '0F172A');
        [$accent, ] = Color::parse($colors['accent'] ?? '#8B5CF6', '8B5CF6');

        $heading = Xml::attr((string) ($deck['theme']['fonts']['heading'] ?? 'Calibri'));
        $body = Xml::attr((string) ($deck['theme']['fonts']['body'] ?? 'Calibri'));

        return Xml::declaration()
            . '<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="DarkSlide">'
            . '<a:themeElements>'
            . '<a:clrScheme name="DarkSlide">'
            . '<a:dk1><a:srgbClr val="' . $text . '"/></a:dk1>'
            . '<a:lt1><a:srgbClr val="' . $bg . '"/></a:lt1>'
            . '<a:dk2><a:srgbClr val="44546A"/></a:dk2>'
            . '<a:lt2><a:srgbClr val="E7E6E6"/></a:lt2>'
            . '<a:accent1><a:srgbClr val="' . $accent . '"/></a:accent1>'
            . '<a:accent2><a:srgbClr val="ED7D31"/></a:accent2>'
            . '<a:accent3><a:srgbClr val="A5A5A5"/></a:accent3>'
            . '<a:accent4><a:srgbClr val="FFC000"/></a:accent4>'
            . '<a:accent5><a:srgbClr val="5B9BD5"/></a:accent5>'
            . '<a:accent6><a:srgbClr val="70AD47"/></a:accent6>'
            . '<a:hlink><a:srgbClr val="0563C1"/></a:hlink>'
            . '<a:folHlink><a:srgbClr val="954F72"/></a:folHlink>'
            . '</a:clrScheme>'
            . '<a:fontScheme name="DarkSlide">'
            . '<a:majorFont><a:latin typeface="' . $heading . '"/><a:ea typeface=""/><a:cs typeface=""/></a:majorFont>'
            . '<a:minorFont><a:latin typeface="' . $body . '"/><a:ea typeface=""/><a:cs typeface=""/></a:minorFont>'
            . '</a:fontScheme>'
            . '<a:fmtScheme name="DarkSlide">'
            . '<a:fillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:fillStyleLst>'
            . '<a:lnStyleLst><a:ln w="6350"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln><a:ln w="12700"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln><a:ln w="19050"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln></a:lnStyleLst>'
            . '<a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst>'
            . '<a:bgFillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:bgFillStyleLst>'
            . '</a:fmtScheme>'
            . '</a:themeElements>'
            . '</a:theme>';
    }

    private function buildSlideMaster(): string
    {
        return Xml::declaration()
            . '<p:sldMaster xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" '
            . 'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" '
            . 'xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">'
            . '<p:cSld><p:bg><p:bgRef idx="1001"><a:schemeClr val="bg1"/></p:bgRef></p:bg>'
            . '<p:spTree>'
            . '<p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>'
            . '<p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>'
            . '</p:spTree>'
            . '</p:cSld>'
            . '<p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/>'
            . '<p:sldLayoutIdLst><p:sldLayoutId id="2147483649" r:id="rId1"/></p:sldLayoutIdLst>'
            . '<p:txStyles>'
            . '<p:titleStyle><a:lvl1pPr algn="ctr"><a:defRPr sz="4400"><a:solidFill><a:schemeClr val="tx1"/></a:solidFill></a:defRPr></a:lvl1pPr></p:titleStyle>'
            . '<p:bodyStyle><a:lvl1pPr><a:defRPr sz="2400"><a:solidFill><a:schemeClr val="tx1"/></a:solidFill></a:defRPr></a:lvl1pPr></p:bodyStyle>'
            . '<p:otherStyle/>'
            . '</p:txStyles>'
            . '</p:sldMaster>';
    }

    private function buildSlideMasterRels(): string
    {
        return Xml::declaration()
            . '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
            . '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>'
            . '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="../theme/theme1.xml"/>'
            . '</Relationships>';
    }

    private function buildSlideLayout(): string
    {
        return Xml::declaration()
            . '<p:sldLayout xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" '
            . 'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" '
            . 'xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" '
            . 'type="blank" preserve="1">'
            . '<p:cSld name="Blank">'
            . '<p:spTree>'
            . '<p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>'
            . '<p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>'
            . '</p:spTree>'
            . '</p:cSld>'
            . '</p:sldLayout>';
    }

    private function buildSlideLayoutRels(): string
    {
        return Xml::declaration()
            . '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
            . '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="../slideMasters/slideMaster1.xml"/>'
            . '</Relationships>';
    }

    // ─── Per-slide rendering ──────────────────────────────────────────────

    /**
     * @param  array<string, mixed>  $slide
     */
    private function buildSlideXml(array $slide, int $slideNumber): string
    {
        $elements = $slide['elements'] ?? [];
        // Z-order: elements without `z` keep their array order; explicit z overrides.
        usort($elements, function ($a, $b) {
            return ($a['z'] ?? -1) <=> ($b['z'] ?? -1);
        });

        $shapeId = 2; // 1 is reserved for the slide's nvGrpSpPr
        $shapeTreeXml = '';
        $slideRels = []; // collected for the slide's _rels file

        $bg = $this->buildBackground($slide['background'] ?? null, $slideNumber, $slideRels);

        foreach ($elements as $element) {
            if (!is_array($element) || !isset($element['type'])) {
                continue;
            }
            if (!empty($element['hidden'])) {
                continue;
            }
            [$xml, $rels] = $this->buildElementXml($element, $shapeId, $slideNumber);
            if ($xml === '') {
                continue;
            }
            $shapeTreeXml .= $xml;
            $slideRels = array_merge($slideRels, $rels);
            $shapeId++;
        }

        // Persist the rels for buildSlideRels() to merge with the notes rel.
        $this->pendingSlideRels[$slideNumber] = $slideRels;

        return Xml::declaration()
            . '<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" '
            . 'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" '
            . 'xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">'
            . '<p:cSld>'
            . $bg
            . '<p:spTree>'
            . '<p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>'
            . '<p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>'
            . $shapeTreeXml
            . '</p:spTree>'
            . '</p:cSld>'
            . '</p:sld>';
    }

    /** Accumulated per-slide rels keyed by 1-based slide number. */
    private array $pendingSlideRels = [];

    /**
     * Build the slide background XML. Three shapes are supported:
     *
     *   `image`    — CSS `url()` or path; embeds the binary as a media
     *                relationship + `<p:blipFill>`.
     *   `gradient` — CSS-style `linear-gradient(...)` parsed into PPTX
     *                `<a:gradFill>` with stops; angles converted to
     *                drawingML's 60,000ths-of-a-degree units.
     *   `color`    — solid fill (fallback when nothing else matches).
     *
     * @param  array<string, mixed>  $bg
     * @param  int  $slideNumber  used to keep media rel ids unique
     * @param  list<array{id: string, type: string, target: string}>  $rels  populated when a background image is embedded
     */
    private function buildBackground(mixed $bg, int $slideNumber, array &$rels): string
    {
        if (!is_array($bg)) {
            return '';
        }

        if (isset($bg['image']) && is_string($bg['image']) && $bg['image'] !== '') {
            $embed = $this->stageMedia($bg['image'], $slideNumber);
            if ($embed !== null) {
                $rels[] = [
                    'id' => $embed['relId'],
                    'type' => 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/image',
                    'target' => $embed['target'],
                ];

                return '<p:bg><p:bgPr>'
                    . '<a:blipFill dpi="0" rotWithShape="1"><a:blip r:embed="' . $embed['relId'] . '"/><a:srcRect/><a:stretch><a:fillRect/></a:stretch></a:blipFill>'
                    . '<a:effectLst/></p:bgPr></p:bg>';
            }
            // Fall through to gradient / color when the image couldn't be staged.
        }

        if (isset($bg['gradient']) && is_string($bg['gradient'])) {
            $grad = $this->parseGradient($bg['gradient']);
            if ($grad !== null) {
                return '<p:bg><p:bgPr>' . $grad . '<a:effectLst/></p:bgPr></p:bg>';
            }
        }

        if (isset($bg['color']) && is_string($bg['color'])) {
            [$hex, $alpha] = Color::parse($bg['color']);

            return '<p:bg><p:bgPr><a:solidFill><a:srgbClr val="' . $hex . '"><a:alpha val="' . $alpha . '"/></a:srgbClr></a:solidFill><a:effectLst/></p:bgPr></p:bg>';
        }

        return '';
    }

    /**
     * Parse a CSS-style `linear-gradient(...)` string into a PPTX
     * `<a:gradFill>` block. Supports angle-or-direction + 2+ stops; falls
     * back to null when the input doesn't look like a CSS gradient.
     *
     * Examples that parse:
     *   linear-gradient(135deg, #fef3c7 0%, #fce7f3 100%)
     *   linear-gradient(to right, #ff0000, #00ff00)
     *   linear-gradient(#000, #fff)
     */
    private function parseGradient(string $css): ?string
    {
        $css = trim($css);
        if (!preg_match('/^linear-gradient\((.+)\)\s*;?\s*$/i', $css, $m)) {
            return null;
        }
        $args = $m[1];

        // Split top-level commas (rgba() inside stops contains commas too).
        $parts = $this->splitTopLevelCommas($args);
        if (count($parts) < 2) {
            return null;
        }

        // Direction is optional. It's the first part iff it doesn't look
        // like a color stop.
        $angleDeg = 90.0; // CSS default — top to bottom
        $first = trim($parts[0]);
        $directionLike = preg_match('/^(?:to\s+|[-+]?[0-9.]+(?:deg|rad|turn|grad)?\s*$)/i', $first) === 1;
        if ($directionLike) {
            $angleDeg = $this->parseGradientDirection($first);
            array_shift($parts);
        }

        // Remaining parts are stops: "color [position]"
        $stops = [];
        $count = count($parts);
        foreach ($parts as $i => $part) {
            $part = trim($part);
            // Pull off the trailing position (e.g. "50%" or "0.5"); the rest is the color.
            if (preg_match('/^(.+?)\s+([0-9.]+%?)\s*$/', $part, $sm)) {
                $colorStr = $sm[1];
                $posStr = $sm[2];
                if (str_ends_with($posStr, '%')) {
                    $pos = (float) rtrim($posStr, '%') / 100;
                } else {
                    $pos = (float) $posStr;
                }
            } else {
                $colorStr = $part;
                $pos = $count <= 1 ? 0.0 : $i / ($count - 1);
            }
            [$hex, ] = Color::parse($colorStr);
            $stops[] = ['hex' => $hex, 'pos' => max(0.0, min(1.0, $pos))];
        }

        $gsList = '';
        foreach ($stops as $stop) {
            $pos1000 = (int) round($stop['pos'] * 100000);
            $gsList .= '<a:gs pos="' . $pos1000 . '"><a:srgbClr val="' . $stop['hex'] . '"/></a:gs>';
        }

        // PPTX angles are in 60000ths of a degree, measured clockwise from
        // east (so CSS 0deg=top becomes PPTX 270deg). CSS is clockwise from
        // north → PPTX is clockwise from east; subtract 90 + clamp.
        $pptxAngle = (int) round(($angleDeg - 90) * 60000);
        $pptxAngle = (($pptxAngle % (360 * 60000)) + (360 * 60000)) % (360 * 60000);

        return '<a:gradFill flip="none" rotWithShape="1">'
            . '<a:gsLst>' . $gsList . '</a:gsLst>'
            . '<a:lin ang="' . $pptxAngle . '" scaled="0"/>'
            . '</a:gradFill>';
    }

    /**
     * Split a comma-separated argument list while respecting parentheses.
     * Used so `rgb(255, 0, 0)` inside a gradient stop doesn't get cut up.
     *
     * @return list<string>
     */
    private function splitTopLevelCommas(string $s): array
    {
        $out = [];
        $depth = 0;
        $buf = '';
        $len = strlen($s);
        for ($i = 0; $i < $len; $i++) {
            $c = $s[$i];
            if ($c === '(') {
                $depth++;
                $buf .= $c;
            } elseif ($c === ')') {
                $depth = max(0, $depth - 1);
                $buf .= $c;
            } elseif ($c === ',' && $depth === 0) {
                $out[] = $buf;
                $buf = '';
            } else {
                $buf .= $c;
            }
        }
        if ($buf !== '') {
            $out[] = $buf;
        }

        return $out;
    }

    /**
     * Convert a CSS gradient direction (`135deg`, `to right`, `to top left`)
     * into a CSS-clockwise angle in degrees, 0 = up.
     */
    private function parseGradientDirection(string $dir): float
    {
        $dir = trim($dir);
        if (preg_match('/^([-+]?[0-9.]+)deg$/i', $dir, $m)) {
            return (float) $m[1];
        }
        if (preg_match('/^([-+]?[0-9.]+)rad$/i', $dir, $m)) {
            return ((float) $m[1]) * 180 / M_PI;
        }
        if (preg_match('/^([-+]?[0-9.]+)turn$/i', $dir, $m)) {
            return ((float) $m[1]) * 360;
        }
        return match (strtolower($dir)) {
            'to top' => 0,
            'to top right' => 45,
            'to right' => 90,
            'to bottom right' => 135,
            'to bottom' => 180,
            'to bottom left' => 225,
            'to left' => 270,
            'to top left' => 315,
            default => 180, // top→bottom (CSS default)
        };
    }

    /**
     * Build a single element's shape XML + any relationships it needs.
     *
     * @param  array<string, mixed>  $element
     * @return array{0: string, 1: list<array{id: string, type: string, target: string}>}
     */
    private function buildElementXml(array $element, int $shapeId, int $slideNumber): array
    {
        $rels = [];
        $xml = match ($element['type']) {
            'text' => $this->buildTextShape($element, $shapeId),
            'image' => $this->buildImageShape($element, $shapeId, $slideNumber, $rels),
            'shape' => $this->buildShape($element, $shapeId),
            'code' => $this->buildCodeShape($element, $shapeId),
            'chart' => $this->buildPlaceholder('[chart]', $element, $shapeId),
            'table' => $this->buildTable($element, $shapeId),
            'embed' => $this->buildPlaceholder('[embed: ' . (string) ($element['src'] ?? '') . ']', $element, $shapeId),
            default => '',
        };

        return [$xml, $rels];
    }

    // ─── Element renderers ────────────────────────────────────────────────

    /** @param array<string, mixed> $element */
    private function buildTextShape(array $element, int $shapeId): string
    {
        $xfrm = $this->xfrmFromFractions($element);
        $body = $this->buildTextBody((string) ($element['content'] ?? ''), $element['style'] ?? [], $element['format'] ?? 'plain');
        $id = $element['id'] ?? "text-{$shapeId}";

        return '<p:sp>'
            . '<p:nvSpPr>'
            . '<p:cNvPr id="' . $shapeId . '" name="' . Xml::attr((string) $id) . '"/>'
            . '<p:cNvSpPr txBox="1"/>'
            . '<p:nvPr/>'
            . '</p:nvSpPr>'
            . '<p:spPr>'
            . $xfrm
            . '<a:prstGeom prst="rect"><a:avLst/></a:prstGeom>'
            . '<a:noFill/>'
            . '</p:spPr>'
            . $body
            . '</p:sp>';
    }

    /**
     * @param  array<string, mixed>  $element
     * @param  list<array{id: string, type: string, target: string}>  $rels  populated with the embedded-image relationship.
     */
    private function buildImageShape(array $element, int $shapeId, int $slideNumber, array &$rels): string
    {
        $src = (string) ($element['src'] ?? '');
        $embed = $this->stageMedia($src, $slideNumber);
        if ($embed === null) {
            // Image couldn't be embedded — fall back to a placeholder text box.
            return $this->buildPlaceholder('[image: ' . $src . ']', $element, $shapeId);
        }
        $relId = $embed['relId'];
        $rels[] = [
            'id' => $relId,
            'type' => 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/image',
            'target' => $embed['target'],
        ];

        $xfrm = $this->xfrmFromFractions($element);
        $id = $element['id'] ?? "image-{$shapeId}";
        $alt = Xml::attr((string) ($element['alt'] ?? ''));

        return '<p:pic>'
            . '<p:nvPicPr>'
            . '<p:cNvPr id="' . $shapeId . '" name="' . Xml::attr((string) $id) . '" descr="' . $alt . '"/>'
            . '<p:cNvPicPr><a:picLocks noChangeAspect="1"/></p:cNvPicPr>'
            . '<p:nvPr/>'
            . '</p:nvPicPr>'
            . '<p:blipFill><a:blip r:embed="' . $relId . '"/><a:stretch><a:fillRect/></a:stretch></p:blipFill>'
            . '<p:spPr>'
            . $xfrm
            . '<a:prstGeom prst="rect"><a:avLst/></a:prstGeom>'
            . '</p:spPr>'
            . '</p:pic>';
    }

    /** @param array<string, mixed> $element */
    private function buildShape(array $element, int $shapeId): string
    {
        $xfrm = $this->xfrmFromFractions($element);
        $id = $element['id'] ?? "shape-{$shapeId}";
        $kind = (string) ($element['shape'] ?? 'rect');
        $prst = match ($kind) {
            'rect' => 'rect',
            'rounded-rect' => 'roundRect',
            'ellipse' => 'ellipse',
            'triangle' => 'triangle',
            'line' => 'line',
            'arrow' => 'rightArrow',
            default => 'rect',
        };

        [$fillHex, $fillAlpha] = Color::parse($element['fill'] ?? 'rgba(139,92,246,0.15)', '8B5CF6');
        [$strokeHex, ] = Color::parse($element['stroke'] ?? '#8B5CF6', '8B5CF6');
        $strokeWidthEmu = Emu::fromPt((float) ($element['strokeWidth'] ?? 2));
        $dashStr = !empty($element['dashed']) ? '<a:prstDash val="dash"/>' : '';

        $fillXml = $fillAlpha === 0
            ? '<a:noFill/>'
            : '<a:solidFill><a:srgbClr val="' . $fillHex . '"><a:alpha val="' . $fillAlpha . '"/></a:srgbClr></a:solidFill>';

        return '<p:sp>'
            . '<p:nvSpPr>'
            . '<p:cNvPr id="' . $shapeId . '" name="' . Xml::attr((string) $id) . '"/>'
            . '<p:cNvSpPr/>'
            . '<p:nvPr/>'
            . '</p:nvSpPr>'
            . '<p:spPr>'
            . $xfrm
            . '<a:prstGeom prst="' . $prst . '"><a:avLst/></a:prstGeom>'
            . $fillXml
            . '<a:ln w="' . $strokeWidthEmu . '"><a:solidFill><a:srgbClr val="' . $strokeHex . '"/></a:solidFill>' . $dashStr . '</a:ln>'
            . '</p:spPr>'
            . '<p:txBody><a:bodyPr/><a:lstStyle/><a:p><a:endParaRPr lang="en-US"/></a:p></p:txBody>'
            . '</p:sp>';
    }

    /** @param array<string, mixed> $element */
    private function buildCodeShape(array $element, int $shapeId): string
    {
        $xfrm = $this->xfrmFromFractions($element);
        $code = (string) ($element['code'] ?? '');
        $id = $element['id'] ?? "code-{$shapeId}";
        $language = isset($element['language']) ? (string) $element['language'] : null;
        $body = $this->buildHighlightedCodeBody($code, $language);

        return '<p:sp>'
            . '<p:nvSpPr>'
            . '<p:cNvPr id="' . $shapeId . '" name="' . Xml::attr((string) $id) . '"/>'
            . '<p:cNvSpPr txBox="1"/>'
            . '<p:nvPr/>'
            . '</p:nvSpPr>'
            . '<p:spPr>'
            . $xfrm
            . '<a:prstGeom prst="rect"><a:avLst/></a:prstGeom>'
            . '<a:solidFill><a:srgbClr val="0F172A"/></a:solidFill>'
            . '</p:spPr>'
            . $body
            . '</p:sp>';
    }

    /**
     * Build a `<p:txBody>` for a code block: monospace, dark fill, one
     * `<a:r>` per highlighted token so keywords / strings / comments /
     * numbers render in distinct colors.
     */
    private function buildHighlightedCodeBody(string $code, ?string $language): string
    {
        $sz = Emu::hundredthsOfPoint(12);
        $paragraphs = '';
        $lines = explode("\n", $code);
        foreach ($lines as $line) {
            $tokens = SyntaxHighlighter::tokenize($line, $language);
            $runs = '';
            foreach ($tokens as $token) {
                if ($token['text'] === '') {
                    continue;
                }
                $color = SyntaxHighlighter::colorFor($token['kind']);
                $runs .= '<a:r>'
                    . '<a:rPr lang="en-US" sz="' . $sz . '">'
                    . '<a:solidFill><a:srgbClr val="' . $color . '"/></a:solidFill>'
                    . '<a:latin typeface="Consolas"/>'
                    . '</a:rPr>'
                    . '<a:t>' . Xml::text($token['text']) . '</a:t>'
                    . '</a:r>';
            }
            if ($runs === '') {
                // Preserve blank lines so the rendered layout matches the source.
                $runs = '<a:endParaRPr lang="en-US" sz="' . $sz . '"/>';
            }
            $paragraphs .= '<a:p><a:pPr algn="l"/>' . $runs . '</a:p>';
        }

        return '<p:txBody>'
            . '<a:bodyPr wrap="square" anchor="t" rtlCol="0" lIns="91440" tIns="45720" rIns="91440" bIns="45720"/>'
            . '<a:lstStyle/>'
            . $paragraphs
            . '</p:txBody>';
    }

    /**
     * Build a real PPTX table — `<p:graphicFrame>` wrapping `<a:tbl>`.
     * Header row gets the accent color background + white bold text;
     * body rows alternate between transparent and a tinted "surface" fill
     * for readability.
     *
     * @param  array<string, mixed>  $element
     */
    private function buildTable(array $element, int $shapeId): string
    {
        $columns = is_array($element['columns'] ?? null) ? $element['columns'] : [];
        $rows = is_array($element['rows'] ?? null) ? $element['rows'] : [];
        if (empty($columns)) {
            return $this->buildPlaceholder('[table: no columns]', $element, $shapeId);
        }

        $totalWidthEmu = Emu::fromFracX((float) ($element['w'] ?? 0.5));
        $colCount = count($columns);
        $colWidthEmu = (int) round($totalWidthEmu / max(1, $colCount));

        // Approximate row height — 40pt header, 30pt body. Could be tighter.
        $headerRowH = Emu::fromPt(40);
        $bodyRowH = Emu::fromPt(30);

        $gridCols = '';
        foreach ($columns as $i => $_) {
            $gridCols .= '<a:gridCol w="' . $colWidthEmu . '"/>';
        }

        // Header row
        $headerCells = '';
        foreach ($columns as $col) {
            $label = (string) ($col['label'] ?? $col['key'] ?? '');
            $headerCells .= $this->buildTableCell($label, true);
        }
        $headerRow = '<a:tr h="' . $headerRowH . '">' . $headerCells . '</a:tr>';

        // Body rows
        $bodyRows = '';
        $rowIndex = 0;
        foreach ($rows as $row) {
            if (!is_array($row)) {
                continue;
            }
            $cells = '';
            foreach ($columns as $col) {
                $key = (string) ($col['key'] ?? '');
                $value = $row[$key] ?? '';
                $text = is_scalar($value) ? (string) $value : json_encode($value);
                $cells .= $this->buildTableCell((string) $text, false, $rowIndex % 2 === 1);
            }
            $bodyRows .= '<a:tr h="' . $bodyRowH . '">' . $cells . '</a:tr>';
            $rowIndex++;
        }

        $xfrm = $this->xfrmFromFractions($element);
        $id = $element['id'] ?? "table-{$shapeId}";

        return '<p:graphicFrame>'
            . '<p:nvGraphicFramePr>'
            . '<p:cNvPr id="' . $shapeId . '" name="' . Xml::attr((string) $id) . '"/>'
            . '<p:cNvGraphicFramePr><a:graphicFrameLocks noGrp="1"/></p:cNvGraphicFramePr>'
            . '<p:nvPr/>'
            . '</p:nvGraphicFramePr>'
            . '<p:xfrm>' . substr($xfrm, strlen('<a:xfrm>'), -strlen('</a:xfrm>')) . '</p:xfrm>'
            . '<a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">'
            . '<a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/table">'
            . '<a:tbl>'
            . '<a:tblPr firstRow="1" bandRow="1"><a:tableStyleId>{5C22544A-7EE6-4342-B048-85BDC9FD1C3A}</a:tableStyleId></a:tblPr>'
            . '<a:tblGrid>' . $gridCols . '</a:tblGrid>'
            . $headerRow
            . $bodyRows
            . '</a:tbl>'
            . '</a:graphicData>'
            . '</a:graphic>'
            . '</p:graphicFrame>';
    }

    /**
     * Build a single `<a:tc>` table cell. Header cells get a violet fill +
     * white bold text; striped body rows get a subtle tint.
     */
    private function buildTableCell(string $text, bool $header, bool $striped = false): string
    {
        if ($header) {
            $fill = '<a:solidFill><a:srgbClr val="8B5CF6"/></a:solidFill>';
            $textColor = 'FFFFFF';
            $bold = ' b="1"';
        } else {
            $fill = $striped
                ? '<a:solidFill><a:srgbClr val="F8FAFC"/></a:solidFill>'
                : '<a:noFill/>';
            $textColor = '0F172A';
            $bold = '';
        }

        return '<a:tc>'
            . '<a:txBody>'
            . '<a:bodyPr wrap="square" anchor="ctr" lIns="91440" tIns="45720" rIns="91440" bIns="45720"/>'
            . '<a:lstStyle/>'
            . '<a:p><a:pPr algn="l"/><a:r><a:rPr lang="en-US" sz="1400"' . $bold . '><a:solidFill><a:srgbClr val="' . $textColor . '"/></a:solidFill></a:rPr><a:t>' . Xml::text($text) . '</a:t></a:r></a:p>'
            . '</a:txBody>'
            . '<a:tcPr>' . $fill . '</a:tcPr>'
            . '</a:tc>';
    }

    /** @param array<string, mixed> $element */
    private function buildPlaceholder(string $label, array $element, int $shapeId): string
    {
        return $this->buildTextShape([
            'id' => $element['id'] ?? "placeholder-{$shapeId}",
            'type' => 'text',
            'x' => $element['x'] ?? 0.1,
            'y' => $element['y'] ?? 0.4,
            'w' => $element['w'] ?? 0.8,
            'h' => $element['h'] ?? 0.2,
            'content' => $label,
            'format' => 'plain',
            'style' => ['fontSize' => 20, 'align' => 'center', 'color' => '#64748B'],
        ], $shapeId);
    }

    // ─── Text body / paragraphs / runs ────────────────────────────────────

    /**
     * Build the `<p:txBody>` for a text shape.
     *
     * In "markdown" mode each paragraph is tokenized with
     * {@see MarkdownInline::tokenize()} so bold / italic / code spans
     * become real per-`<a:r>` `<a:rPr>` decorations rather than
     * flattening to plain text. Bulleted lines (`- ` / `* ` prefix)
     * become paragraphs with bullet point markup.
     *
     * @param  array<string, mixed>  $style
     */
    private function buildTextBody(string $content, array $style, string $format): string
    {
        $fontPt = (float) ($style['fontSize'] ?? 24);
        // Convert the design-width-relative font size to a usable PPTX size.
        // The fancy-slides design width is 1920px; PPTX assumes ~720px-wide
        // rendering at 10 inches, so we apply a heuristic divisor of 2 to
        // land in PPTX-sensible territory.
        $pt = max(8.0, $fontPt / 2);
        $sz = Emu::hundredthsOfPoint($pt);
        $baseBold = $this->weightToBold($style['weight'] ?? null);
        $baseItalic = !empty($style['italic']) ? ' i="1"' : '';
        $baseUnderline = !empty($style['underline']) ? ' u="sng"' : '';
        $align = $this->alignToAlgn($style['align'] ?? 'left');
        [$colorHex, ] = Color::parse((string) ($style['color'] ?? '#0F172A'), '0F172A');
        $fontFamily = isset($style['fontFamily']) ? '<a:latin typeface="' . Xml::attr((string) $style['fontFamily']) . '"/>' : '';
        $anchor = match ($style['verticalAlign'] ?? 'top') {
            'middle' => 't="ctr"',
            'bottom' => 't="b"',
            default => 't="t"',
        };

        $renderRuns = $format === 'markdown';

        $paragraphs = '';
        $lines = explode("\n", $content);
        foreach ($lines as $line) {
            // Paragraph-level markers: heading first (it disqualifies
            // bullets), then bullet. Heading content drops the `# ` prefix
            // and gets an inflated, bold-by-default size.
            $headingLevel = 0;
            $isBullet = false;
            $body = $line;
            if ($renderRuns) {
                [$headingLevel, $body] = MarkdownInline::headingPrefix($line);
                if ($headingLevel === 0) {
                    [$isBullet, $body] = MarkdownInline::bulletPrefix($line);
                }
            }

            // Heading lines get a bigger font + bold base; level 1 is
            // largest, falling toward the base body size at level 4+.
            $paragraphSz = $sz;
            $paragraphBold = $baseBold;
            if ($headingLevel > 0) {
                $multiplier = match ($headingLevel) {
                    1 => 1.8,
                    2 => 1.45,
                    3 => 1.2,
                    default => 1.0,
                };
                $paragraphSz = Emu::hundredthsOfPoint($pt * $multiplier);
                $paragraphBold = ' b="1"';
            }

            $pPr = '<a:pPr algn="' . $align . '"';
            if ($isBullet) {
                $pPr .= ' indent="-228600" marL="228600"><a:buFont typeface="Arial"/><a:buChar char="•"/>';
            } else {
                $pPr .= '><a:buNone/>';
            }
            $pPr .= '</a:pPr>';

            $runs = '';
            if ($renderRuns) {
                $tokens = MarkdownInline::tokenize($body);
                foreach ($tokens as $token) {
                    $runs .= $this->buildRun($token['text'], $paragraphSz, $paragraphBold, $baseItalic, $baseUnderline, $colorHex, $fontFamily, $token['b'], $token['i'], $token['code']);
                }
            } else {
                $runs = $this->buildRun($body, $paragraphSz, $paragraphBold, $baseItalic, $baseUnderline, $colorHex, $fontFamily, false, false, false);
            }

            $paragraphs .= '<a:p>' . $pPr . $runs . '</a:p>';
        }

        return '<p:txBody>'
            . '<a:bodyPr wrap="square" anchor="' . substr($anchor, 3, -1) . '" rtlCol="0"/>'
            . '<a:lstStyle/>'
            . $paragraphs
            . '</p:txBody>';
    }

    /**
     * Build a single `<a:r>` (drawingML text run) with the supplied base
     * formatting layered on top of inline markdown flags from the tokenizer.
     *
     * `code` spans switch to the theme's mono font + a darker fill so
     * they read as code on every theme. Inline `**bold**` overrides the
     * base weight even when the surrounding text was non-bold; inline
     * `*italic*` is additive.
     */
    private function buildRun(string $text, int $sz, string $baseBold, string $baseItalic, string $baseUnderline, string $colorHex, string $fontFamily, bool $bold, bool $italic, bool $code): string
    {
        $b = $bold ? ' b="1"' : $baseBold;
        $i = ($italic ? ' i="1"' : '') ?: $baseItalic;
        $u = $baseUnderline;
        $color = $colorHex;
        $family = $fontFamily;

        if ($code) {
            // Inline code: keep the run inline but switch font + tint.
            $color = '8B5CF6';
            $family = '<a:latin typeface="Consolas"/>';
        }

        $rPr = '<a:rPr lang="en-US" sz="' . $sz . '"' . $b . $i . $u . '><a:solidFill><a:srgbClr val="' . $color . '"/></a:solidFill>' . $family . '</a:rPr>';

        return '<a:r>' . $rPr . '<a:t>' . Xml::text($text) . '</a:t></a:r>';
    }

    /** @param mixed $weight */
    private function weightToBold(mixed $weight): string
    {
        if (is_numeric($weight) && (int) $weight >= 600) {
            return ' b="1"';
        }
        if (in_array($weight, ['bold', 'semibold'], true)) {
            return ' b="1"';
        }

        return '';
    }

    private function alignToAlgn(string $align): string
    {
        return match ($align) {
            'center' => 'ctr',
            'right' => 'r',
            'justify' => 'just',
            default => 'l',
        };
    }

    // ─── Geometry helper ──────────────────────────────────────────────────

    /** @param array<string, mixed> $element */
    private function xfrmFromFractions(array $element): string
    {
        $x = Emu::fromFracX((float) ($element['x'] ?? 0));
        $y = Emu::fromFracY((float) ($element['y'] ?? 0));
        $cx = Emu::fromFracX((float) ($element['w'] ?? 0));
        $cy = Emu::fromFracY((float) ($element['h'] ?? 0));
        $rot = isset($element['rotation']) ? (int) round(((float) $element['rotation']) * 60000) : 0;
        $rotAttr = $rot !== 0 ? ' rot="' . $rot . '"' : '';

        return '<a:xfrm' . $rotAttr . '><a:off x="' . $x . '" y="' . $y . '"/><a:ext cx="' . $cx . '" cy="' . $cy . '"/></a:xfrm>';
    }

    // ─── Media staging ────────────────────────────────────────────────────

    /**
     * @return array{relId: string, target: string}|null
     */
    private function stageMedia(string $src, int $slideNumber): ?array
    {
        $data = $this->loadImageBytes($src);
        if ($data === null) {
            return null;
        }
        $this->mediaCounter++;
        $i = $this->mediaCounter;
        $ext = $this->extensionForMime($data['mime']) ?? 'png';
        $archivePath = "ppt/media/image{$i}.{$ext}";
        $this->mediaFiles[$archivePath] = $data['bytes'];

        // Slide rels reference the media via a relative path. We assign rel
        // ids per slide; mediaCounter is global, so collisions can't happen.
        $relId = 'rId' . $i;

        return [
            'relId' => $relId,
            'target' => "../media/image{$i}.{$ext}",
        ];
    }

    /**
     * @return array{bytes: string, mime: string}|null
     */
    private function loadImageBytes(string $src): ?array
    {
        // data: URI — decode inline.
        if (preg_match('/^data:([^;,]+)(?:;base64)?,(.*)$/s', $src, $m) === 1) {
            $mime = $m[1];
            $payload = $m[2];
            $bytes = str_contains($src, ';base64,') ? base64_decode($payload, true) : urldecode($payload);
            if ($bytes === false) {
                return null;
            }

            return ['bytes' => $bytes, 'mime' => $mime];
        }

        // file:// URL — read from disk.
        if (str_starts_with($src, 'file://')) {
            $path = substr($src, 7);
            if (!is_file($path)) {
                return null;
            }
            $bytes = file_get_contents($path);
            if ($bytes === false) {
                return null;
            }

            return ['bytes' => $bytes, 'mime' => $this->guessMimeFromPath($path)];
        }

        // Local path (no scheme).
        if (!str_contains($src, '://') && is_file($src)) {
            $bytes = file_get_contents($src);
            if ($bytes === false) {
                return null;
            }

            return ['bytes' => $bytes, 'mime' => $this->guessMimeFromPath($src)];
        }

        // http(s) URLs are NOT auto-fetched — that's a security boundary
        // we leave to the caller. Returning null falls back to a text
        // placeholder.
        return null;
    }

    private function guessMimeFromPath(string $path): string
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

    private function extensionForMime(string $mime): ?string
    {
        return match ($mime) {
            'image/png' => 'png',
            'image/jpeg' => 'jpg',
            'image/gif' => 'gif',
            'image/svg+xml' => 'svg',
            'image/webp' => 'webp',
            default => null,
        };
    }

    // ─── Slide rels ───────────────────────────────────────────────────────

    private function buildSlideRels(int $slideNumber, bool $hasNotes): string
    {
        $rels = '';
        // Required: slide → layout.
        $rels .= '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>';
        $nextRelNum = 2;

        // Optional: slide → notesSlide.
        if ($hasNotes) {
            $rels .= '<Relationship Id="rId' . $nextRelNum . '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/notesSlide" Target="../notesSlides/notesSlide' . $slideNumber . '.xml"/>';
            $nextRelNum++;
        }

        // Media rels (set during slide build via $pendingSlideRels).
        foreach ($this->pendingSlideRels[$slideNumber] ?? [] as $rel) {
            $rels .= '<Relationship Id="' . Xml::attr($rel['id']) . '" Type="' . Xml::attr($rel['type']) . '" Target="' . Xml::attr($rel['target']) . '"/>';
        }

        return Xml::declaration()
            . '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
            . $rels
            . '</Relationships>';
    }

    // ─── Notes slides ─────────────────────────────────────────────────────

    /**
     * @param  array<string, mixed>  $slide
     */
    private function buildNotesSlideXml(array $slide, int $slideNumber): string
    {
        $notes = (string) ($slide['notes'] ?? '');
        $paragraphs = '';
        foreach (explode("\n", $notes) as $line) {
            $paragraphs .= '<a:p><a:r><a:rPr lang="en-US" sz="1200"/><a:t>' . Xml::text($line) . '</a:t></a:r></a:p>';
        }

        return Xml::declaration()
            . '<p:notes xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" '
            . 'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" '
            . 'xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">'
            . '<p:cSld>'
            . '<p:spTree>'
            . '<p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>'
            . '<p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>'
            . '<p:sp>'
            . '<p:nvSpPr>'
            . '<p:cNvPr id="2" name="Notes Placeholder"/>'
            . '<p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr>'
            . '<p:nvPr><p:ph type="body"/></p:nvPr>'
            . '</p:nvSpPr>'
            . '<p:spPr><a:xfrm><a:off x="685800" y="1700213"/><a:ext cx="5772150" cy="3679371"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr>'
            . '<p:txBody><a:bodyPr/><a:lstStyle/>'
            . $paragraphs
            . '</p:txBody>'
            . '</p:sp>'
            . '</p:spTree>'
            . '</p:cSld>'
            . '</p:notes>';
    }

    private function buildNotesSlideRels(int $slideNumber): string
    {
        return Xml::declaration()
            . '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
            . '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="../slides/slide' . $slideNumber . '.xml"/>'
            . '</Relationships>';
    }
}
