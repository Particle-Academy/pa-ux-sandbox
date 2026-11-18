<?php

declare(strict_types=1);

namespace App\Http\Controllers\Showcase;

use App\Http\Requests\Showcase\QrDemoRequest;
use App\Http\Requests\Showcase\QuoteDemoRequest;
use App\Support\Documents\QuoteDemo;
use FancyQr\QrCode;
use FancyQr\QrException;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\Response;

/**
 * The live demos on /features/documents that need the server: the quote
 * (fancy-formula, fancy-template, fine-print, last-word, holy-sheet) and the
 * server QR code (fancy-qr).
 *
 * Safe on production by construction: nothing is stored, nothing is sent
 * anywhere, every input is bounded by a Form Request, and the routes are
 * throttled. A visitor's company and contact names live for one request.
 */
final class DocumentsDemoController
{
    private const MIME = [
        'pdf' => 'application/pdf',
        'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'xlsx' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];

    /** The priced data, the PHP render of the document, and the pricing trace. */
    public function quote(QuoteDemoRequest $request): JsonResponse
    {
        $quote = new QuoteDemo($request->quoteInput());

        return response()->json([
            'data' => $quote->data(),
            'document' => $quote->document(),
            'trace' => $quote->pricingTrace(),
        ]);
    }

    /** The quote as a file: PDF (fine-print), DOCX (last-word) or XLSX (holy-sheet). */
    public function file(QuoteDemoRequest $request, string $format): Response
    {
        $quote = new QuoteDemo($request->quoteInput());
        $bytes = match ($format) {
            'pdf' => $quote->pdf(),
            'docx' => $quote->docx(),
            'xlsx' => $quote->xlsx(),
        };

        // A PDF opens inline (the signing demo shows it in a viewer); the
        // office files download.
        $disposition = $format === 'pdf' && $request->boolean('inline') ? 'inline' : 'attachment';

        return response($bytes, 200, [
            'Content-Type' => self::MIME[$format],
            'Content-Disposition' => $disposition.'; filename="'.$quote->filename($format).'"',
            'Cache-Control' => 'no-store',
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }

    /** fancy-qr: the same value as SVG (byte-identical to react-fancy's qrCodeSvg) or PNG. */
    public function qr(QrDemoRequest $request, string $format): Response
    {
        $value = (string) $request->validated('value');
        $label = (string) ($request->validated('label') ?? 'QR code');

        try {
            $body = $format === 'svg' ? QrCode::svg($value, label: $label) : QrCode::png($value, scale: 8);
        } catch (QrException $e) {
            return response()->json(['error' => 'qr_refused', 'message' => $e->getMessage()], 422);
        }

        return response($body, 200, [
            'Content-Type' => $format === 'svg' ? 'image/svg+xml' : 'image/png',
            'Cache-Control' => 'no-store',
            'X-Content-Type-Options' => 'nosniff',
            'Content-Security-Policy' => "default-src 'none'; style-src 'unsafe-inline'",
        ]);
    }
}
