<?php

declare(strict_types=1);

namespace App\Support\Documents;

use Carbon\CarbonImmutable;
use FancyFormula\Engine;
use FancyQr\QrCode;
use FancyTemplate\Template;
use FinePrint\Agent as FinePrint;
use HolySheet\Agent as HolySheet;
use LastWord\Agent as LastWord;
use RuntimeException;

/**
 * The quote on /features/documents: one set of inputs, priced by fancy-formula,
 * filled into fancy-template templates, written by fine-print (PDF), last-word
 * (DOCX) and holy-sheet (XLSX).
 *
 * Nothing here is stored and nothing leaves the server: the visitor's two
 * strings (company and contact) live for one request. The templates are files
 * in resources/documents, so the page shows exactly what renders.
 *
 * Amounts are integer cents end to end. fancy-formula computes them, and the
 * templates' `money` filter formats them without a float in between.
 */
final class QuoteDemo
{
    public const MODELS = ['fixed', 'retainer', 'usage'];

    public const NUMBER = 'Q-2026-0142';

    /** fancy-formula 0.1.0 pricing set. Cents throughout. */
    private const FORMULAS = [
        'fixed_subtotal' => '=fixed_discovery + fixed_design + fixed_build + fixed_qa',
        'retainer_hours_qty' => '=hours * months',
        'retainer_hours_amount' => '=retainer_hours_qty * rate_hour',
        'retainer_support_amount' => '=months * rate_support',
        'retainer_subtotal' => '=retainer_hours_amount + retainer_support_amount',
        'seat_unit' => '=VLOOKUP(seats, price_breaks, 2, TRUE)',
        'seat_qty' => '=seats * 12',
        'seat_amount' => '=seat_qty * seat_unit',
        'hosting_amount' => '=12 * rate_hosting',
        'usage_subtotal' => '=seat_amount + hosting_amount',
        'subtotal' => '=fixed_subtotal * include_fixed + retainer_subtotal * include_retainer + usage_subtotal * include_usage',
        'tax' => '=ROUND(subtotal * tax_rate, 0)',
        'total' => '=subtotal + tax',
    ];

    /** Seat price breaks: from this many seats, this many cents per seat per month. */
    public const PRICE_BREAKS = [[1, 1250], [50, 1100], [100, 975], [500, 840], [1000, 720]];

    private const RATES = [
        'fixed_discovery' => 480000,
        'fixed_design' => 1450000,
        'fixed_build' => 2200000,
        'fixed_qa' => 320000,
        'rate_hour' => 16500,
        'rate_support' => 45000,
        'rate_hosting' => 29000,
    ];

    private const TAX_RATE = 0.0825;

    /** @var array{company: string, contact: string, models: list<string>, seats: int, hours: int, months: int} */
    public const DEFAULTS = [
        'company' => 'Example Corp',
        'contact' => 'Jordan Lee',
        'models' => self::MODELS,
        'seats' => 120,
        'hours' => 20,
        'months' => 6,
    ];

    /** @var array{company: string, contact: string, models: list<string>, seats: int, hours: int, months: int} */
    private array $input;

    /** @var array<string, int>|null */
    private ?array $amounts = null;

    /** @var array<string, mixed>|null */
    private ?array $evaluation = null;

    /**
     * @param  array{company?: string, contact?: string, models?: list<string>, seats?: int, hours?: int, months?: int}  $input
     */
    public function __construct(array $input = [], private ?CarbonImmutable $today = null)
    {
        $merged = array_merge(self::DEFAULTS, array_filter($input, fn ($value): bool => $value !== null && $value !== '' && $value !== []));
        $merged['models'] = array_values(array_intersect(self::MODELS, (array) $merged['models']));
        $this->input = $merged;
    }

    /**
     * The template file, decoded.
     *
     * @return array<string, mixed>
     */
    public static function template(string $writer): array
    {
        $path = resource_path("documents/quote.{$writer}.json");
        $decoded = json_decode((string) file_get_contents($path), true, 512, JSON_THROW_ON_ERROR);

        return is_array($decoded) ? $decoded : throw new RuntimeException("Template {$writer} is not an object");
    }

    /**
     * fancy-formula's results, in cents, keyed by formula name.
     *
     * @return array<string, int>
     */
    public function amounts(): array
    {
        if ($this->amounts !== null) {
            return $this->amounts;
        }

        $inputs = [
            'seats' => ['type' => 'number', 'value' => $this->input['seats'], 'constraints' => ['integer' => true, 'min' => 1]],
            'hours' => ['type' => 'number', 'value' => $this->input['hours'], 'constraints' => ['integer' => true, 'min' => 1]],
            'months' => ['type' => 'number', 'value' => $this->input['months'], 'constraints' => ['integer' => true, 'min' => 1]],
            'tax_rate' => ['type' => 'number', 'value' => self::TAX_RATE],
            'price_breaks' => ['type' => 'range', 'header' => true, 'rows' => [['min_seats', 'cents'], ...self::PRICE_BREAKS]],
        ];
        foreach (self::RATES as $name => $cents) {
            $inputs[$name] = ['type' => 'number', 'value' => $cents];
        }
        foreach (self::MODELS as $model) {
            $inputs["include_{$model}"] = ['type' => 'number', 'value' => in_array($model, $this->input['models'], true) ? 1 : 0];
        }

        $evaluation = (new Engine)->evaluate([
            'version' => 1,
            'formulas' => self::FORMULAS,
            'inputs' => $inputs,
            'trace' => 'lookups',
        ])->toArray();

        if (($evaluation['ok'] ?? false) !== true) {
            throw new RuntimeException('The pricing formulas did not evaluate');
        }

        $amounts = [];
        foreach ($evaluation['results'] as $name => $result) {
            $value = $result['value'] ?? [];
            if (($value['t'] ?? null) !== 'number') {
                throw new RuntimeException("Formula {$name} gave no number");
            }
            $amounts[$name] = (int) round((float) $value['v']);
        }

        $this->evaluation = $evaluation;

        return $this->amounts = $amounts;
    }

    /**
     * What the page shows beside the quote: each formula, its value, and for the
     * lookup the price break it matched.
     *
     * @return list<array{name: string, formula: string, value: int, matched: ?array{row: int, values: list<int|float>}}>
     */
    public function pricingTrace(): array
    {
        $this->amounts();
        $out = [];
        foreach (self::FORMULAS as $name => $formula) {
            $trace = $this->evaluation['traces'][$name] ?? [];
            $match = null;
            foreach ($trace['steps'] ?? [] as $step) {
                if (isset($step['lookup']['match']['rowValues'])) {
                    $match = ['row' => (int) $step['lookup']['match']['row'], 'values' => $step['lookup']['match']['rowValues']];
                }
            }
            $out[] = ['name' => $name, 'formula' => $formula, 'value' => $this->amounts[$name], 'matched' => $match];
        }

        return $out;
    }

    /**
     * The data both templates are filled with. Undeclared keys are ignored by
     * each template, so one object serves the document and the workbook.
     *
     * @return array<string, mixed>
     */
    public function data(): array
    {
        $a = $this->amounts();
        $today = $this->today ?? CarbonImmutable::today();
        $months = $this->input['months'];
        $seats = $this->input['seats'];

        $catalogue = [
            'fixed' => [
                'name' => 'Fixed-fee build',
                'sheet' => 'Fixed-fee build',
                'basis' => 'One price for an agreed scope, invoiced at milestones',
                'summary' => 'We research, design and build the new platform to the scope agreed at discovery, then launch it with you. The price is fixed: changes to scope are quoted separately before any work starts.',
                'note' => 'Invoiced 30% at signature, 40% at design sign-off and 30% at launch.',
                'lines' => [
                    ['description' => 'Discovery and research', 'detail' => 'Stakeholder interviews, analytics review and a written brief', 'qty' => 1, 'unit' => self::RATES['fixed_discovery']],
                    ['description' => 'Design system and interface', 'detail' => 'Tokens, components and every page template, in two review rounds', 'qty' => 1, 'unit' => self::RATES['fixed_design']],
                    ['description' => 'Build and launch', 'detail' => 'Laravel and React build, content migration and go-live', 'qty' => 1, 'unit' => self::RATES['fixed_build']],
                    ['description' => 'Quality and accessibility audit', 'detail' => 'WCAG 2.2 AA review and fixes before launch', 'qty' => 1, 'unit' => self::RATES['fixed_qa']],
                ],
                'subtotal' => $a['fixed_subtotal'],
            ],
            'retainer' => [
                'name' => 'Monthly care retainer',
                'sheet' => 'Care retainer',
                'basis' => "{$this->input['hours']} hours a month for {$months} months",
                'summary' => 'A reserved block of design and engineering time every month, for improvements, new pages and anything the launch uncovers, with priority support for the site itself.',
                'note' => 'Unused hours roll over for one month. Invoiced monthly in advance.',
                'lines' => [
                    ['description' => 'Design and engineering hours', 'detail' => "{$this->input['hours']} hours a month for {$months} months", 'qty' => $a['retainer_hours_qty'], 'unit' => self::RATES['rate_hour']],
                    ['description' => 'Priority support', 'detail' => 'Next-business-day response, uptime monitoring', 'qty' => $months, 'unit' => self::RATES['rate_support']],
                ],
                'subtotal' => $a['retainer_subtotal'],
            ],
            'usage' => [
                'name' => 'Platform licence',
                'sheet' => 'Platform licence',
                'basis' => "{$seats} editor seats for 12 months, priced by volume",
                'summary' => 'The editing platform your team works in, billed per editor seat per month. The seat price falls as the team grows; the break this quote uses is shown beside the line.',
                'note' => 'Seat price breaks: 1-49 seats $12.50, 50-99 $11.00, 100-499 $9.75, 500-999 $8.40, 1,000+ $7.20 per seat per month.',
                'lines' => [
                    ['description' => 'Editor seats', 'detail' => "{$seats} seats x 12 months", 'qty' => $a['seat_qty'], 'unit' => $a['seat_unit']],
                    ['description' => 'Hosting, backups and monitoring', 'detail' => 'Managed hosting, per month', 'qty' => 12, 'unit' => self::RATES['rate_hosting']],
                ],
                'subtotal' => $a['usage_subtotal'],
            ],
        ];

        $models = [];
        foreach ($this->input['models'] as $index => $key) {
            $model = $catalogue[$key];
            $lines = array_map(function (array $line): array {
                $amount = (int) ($line['qty'] * $line['unit']);

                return $line + [
                    'amount' => $amount,
                    'unitAmount' => $line['unit'] / 100,
                    'amountValue' => $amount / 100,
                ];
            }, $model['lines']);
            $models[] = [
                'key' => $key,
                'number' => sprintf('%02d', $index + 1),
                'lines' => $lines,
                'subtotalAmount' => $model['subtotal'] / 100,
            ] + $model;
        }

        $url = 'quotes.example.com/'.self::NUMBER;

        return [
            'quote' => [
                'number' => self::NUMBER,
                'title' => 'Website platform rebuild',
                'issuedAt' => $today->toDateString(),
                'validUntil' => $today->addDays(30)->toDateString(),
                'url' => $url,
            ],
            'seller' => [
                'name' => 'Fieldwork Studio',
                'tagline' => 'Design and engineering for the web',
                'address' => '410 Example Street, Portland, OR 97204',
                'email' => 'hello@example.com',
                'phone' => '+1 555 010 0142',
                'signer' => 'Avery Quinn',
                'signerTitle' => 'Principal',
            ],
            'client' => ['company' => $this->input['company'], 'contact' => $this->input['contact']],
            'intro' => 'Thank you for the conversations over the last few weeks. This quote sets out how we would rebuild your website platform, in up to three parts you can take together or on their own: a fixed-fee build, a monthly care retainer and a platform licence. Each has its own page with the line items behind its price.',
            'models' => $models,
            'subtotal' => $a['subtotal'],
            'taxLabel' => 'Sales tax (8.25%)',
            'tax' => $a['tax'],
            'taxAmount' => $a['tax'] / 100,
            'total' => $a['total'],
            'terms' => [
                'This quote is valid for 30 days from the date of issue.',
                'Prices are in US dollars. Sales tax is shown separately and charged where it applies.',
                'Invoices are payable within 30 days. Late payments may pause scheduled work.',
                'Scope changes are agreed in writing, with their price, before work on them starts.',
                'You own the finished design and code on final payment; the platform licence is a subscription.',
                'Either party may end the retainer or the licence with 30 days written notice.',
            ],
            'qr' => 'data:image/png;base64,'.base64_encode(QrCode::png('https://'.$url, scale: 6)),
        ];
    }

    /**
     * The quote as last-word's document model, rendered by fancy-template's PHP leg.
     *
     * @return array<string, mixed>
     */
    public function document(): array
    {
        return Template::render(self::template('last-word'), $this->data());
    }

    /**
     * The quote as holy-sheet's workbook schema.
     *
     * @return array<string, mixed>
     */
    public function workbook(): array
    {
        return Template::render(self::template('holy-sheet'), $this->data());
    }

    public function pdf(): string
    {
        return FinePrint::toBytes($this->document() + ['defaultFont' => 'Geist'], ['fonts' => self::fonts()]);
    }

    public function docx(): string
    {
        return LastWord::toBytes($this->document());
    }

    public function xlsx(): string
    {
        return HolySheet::toBytes($this->workbook());
    }

    /**
     * The site's own Geist faces (OFL, resources/fonts), embedded as subsets in
     * the PDF. The DOCX names no font, so Word uses the reader's default.
     *
     * @return array<string, array<string, string>>
     */
    public static function fonts(): array
    {
        return ['Geist' => [
            'regular' => resource_path('fonts/Geist-Regular.ttf'),
            'bold' => resource_path('fonts/Geist-Bold.ttf'),
        ]];
    }

    public function filename(string $extension): string
    {
        return 'Fieldwork-Studio-quote-'.self::NUMBER.'.'.$extension;
    }
}
