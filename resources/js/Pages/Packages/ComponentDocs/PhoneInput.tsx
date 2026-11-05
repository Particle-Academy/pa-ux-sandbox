import { useState, type MouseEvent } from "react";
import type { ComponentDoc } from "./types";
import { Button, Form, PhoneInput, Text, type PhoneInputDetail } from "@particle-academy/react-fancy";

/*
 * Every example passes locale="en". The page is server-rendered, and country
 * names come from Intl.DisplayNames in the locale: left to the browser's, the
 * server and the browser can name a country differently and hydration fails.
 */

function Readout({ value, detail }: { value: string | null; detail?: PhoneInputDetail | null }) {
    return (
        <div className="space-y-1">
            <Text size="xs" className="font-mono !text-zinc-500" data-demo="phone-input-value">
                value: {JSON.stringify(value)}
            </Text>
            {detail !== undefined && (
                <Text size="xs" className="font-mono break-all !text-zinc-500" data-demo="phone-input-detail">
                    detail: {JSON.stringify(detail)}
                </Text>
            )}
        </div>
    );
}

function BasicExample() {
    const [value, setValue] = useState<string | null>(null);
    const [detail, setDetail] = useState<PhoneInputDetail | null>(null);
    return (
        <div className="w-full max-w-sm space-y-2" data-demo="phone-input-basic">
            <PhoneInput
                label="Mobile number"
                defaultCountry="MM"
                locale="en"
                value={value}
                onValueChange={(next, d) => {
                    setValue(next);
                    setDetail(d);
                }}
                placeholder="09 4512 3456"
            />
            <Readout value={value} detail={detail} />
        </div>
    );
}

function InternationalExample() {
    const [value, setValue] = useState<string | null>(null);
    const [detail, setDetail] = useState<PhoneInputDetail | null>(null);
    return (
        <div className="w-full max-w-sm space-y-2" data-demo="phone-input-international">
            <PhoneInput
                label="Phone"
                defaultCountry="GB"
                locale="en"
                value={value}
                onValueChange={(next, d) => {
                    setValue(next);
                    setDetail(d);
                }}
                placeholder="Paste +95 9 4512 3456 or 00 1 415 555 0132"
            />
            <Readout value={value} detail={detail} />
        </div>
    );
}

function RestrictedExample() {
    const [value, setValue] = useState<string | null>(null);
    return (
        <div className="w-full max-w-sm space-y-2" data-demo="phone-input-restricted">
            <PhoneInput
                label="Delivery contact"
                description="We deliver to Myanmar, Thailand and Bangladesh."
                countries={["MM", "TH", "BD"]}
                defaultCountry="MM"
                locale="en"
                value={value}
                onValueChange={setValue}
            />
            <Readout value={value} />
        </div>
    );
}

function FormExample() {
    const [value, setValue] = useState<string | null>(null);
    const [check, setCheck] = useState("not checked yet");
    return (
        <Form className="w-full max-w-sm space-y-2" data-demo="phone-input-form" onSubmit={(e) => e.preventDefault()}>
            <PhoneInput name="phone" label="Phone" defaultCountry="CO" locale="en" value={value} onValueChange={setValue} required />
            <Button
                type="button"
                size="sm"
                onClick={(e: MouseEvent<HTMLButtonElement>) => setCheck(e.currentTarget.form?.reportValidity() ? "valid" : "invalid")}
            >
                Check the form
            </Button>
            <Text size="xs" className="font-mono !text-zinc-500" data-demo="phone-input-form-check">
                checkValidity: {check}
            </Text>
        </Form>
    );
}

function ExternalWriteExample() {
    const [value, setValue] = useState<string | null>("+95945123456");
    return (
        <div className="w-full max-w-sm space-y-2" data-demo="phone-input-external">
            <PhoneInput label="Contact" locale="en" value={value} onValueChange={setValue} />
            <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={() => setValue("+442079460958")}>Write +442079460958</Button>
                <Button size="sm" onClick={() => setValue("+14155550132")}>Write +14155550132</Button>
                <Button size="sm" onClick={() => setValue(null)}>Write null</Button>
            </div>
            <Readout value={value} />
        </div>
    );
}

function RtlExample() {
    const [value, setValue] = useState<string | null>("+201001234567");
    return (
        <div dir="rtl" lang="ar" className="w-full max-w-sm space-y-2" data-demo="phone-input-rtl">
            <PhoneInput label="رقم الهاتف" locale="ar" defaultCountry="EG" value={value} onValueChange={setValue} />
            <div dir="ltr">
                <Readout value={value} />
            </div>
        </div>
    );
}

export const phoneInputDoc: ComponentDoc = {
    intro: (
        <Text>
            A country picker and a number field whose value is an <strong>E.164</strong> number (
            <code>+95945123456</code>) or <code>null</code>. Blank is <code>null</code>, half-typed text is{" "}
            <code>null</code> with a reason, and pasting a full international number picks its country. It is a{" "}
            <strong>light</strong> field: a first-party table of dial codes and lengths, no phone-number library.{" "}
            <strong>The length check is a sanity check, not validation</strong>: <code>detail.valid</code> means
            plausible. It does not know which ranges are allocated or whether anyone holds the number, so validate on
            your server before you rely on one.
        </Text>
    ),
    examples: [
        {
            name: "E.164 or null",
            description:
                "Type a Myanmar number the way it is written locally. The trunk prefix 0 is dropped, and the value is E.164 once the number is long enough to be plausible; until then it is null and detail.reason says why. Blank is null with no reason: use required to demand one.",
            render: () => <BasicExample />,
            code: `const [phone, setPhone] = useState<string | null>(null);

<PhoneInput
    label="Mobile number"
    defaultCountry="MM"
    locale="en"
    value={phone}
    onValueChange={(value, detail) => setPhone(value)}
/>
// "09 4512 3456" -> "+95945123456"
// detail: { country: "MM", dialCode: "95", nationalNumber: "945123456", valid: true, reason: null, approximate: false }`,
        },
        {
            name: "Pasting an international number picks its country",
            description:
                "Only + and 00 start an international number. A (0) inside one is dropped, so +44 (0)20 7946 0958 reads as +442079460958. Shared dial codes (+1, +7, +44 and others) choose a country from the leading digits where the table knows them, then the selected country, then the code's main country, and report detail.approximate: the E.164 is exact either way.",
            render: () => <InternationalExample />,
            code: `<PhoneInput label="Phone" defaultCountry="GB" locale="en" value={value} onValueChange={setValue} />
// "+95 9 4512 3456" -> "+95945123456", country follows the dial code
// "+1 416 555 0132" -> "+14165550132", country CA, approximate: true`,
        },
        {
            name: "Restricting the picker",
            description:
                "countries limits the list to these ISO codes, in this order. The picker is searchable by name in the locale, ISO code or dial code, and works from the keyboard: ArrowDown opens it, Enter picks, Escape returns to the button.",
            render: () => <RestrictedExample />,
            code: `<PhoneInput
    label="Delivery contact"
    countries={["MM", "TH", "BD"]}
    defaultCountry="MM"
    locale="en"
    value={value}
    onValueChange={setValue}
/>`,
        },
        {
            name: "In a form",
            description:
                "name posts the E.164 (or an empty string) through a hidden input, never the text on screen. Every reason reaches setCustomValidity, so a native submit is blocked while the number is not whole. Colombia's plan is verified at 10 digits, so a short number fails here.",
            render: () => <FormExample />,
            code: `<Form action="/contact" method="post">
    <PhoneInput name="phone" label="Phone" defaultCountry="CO" locale="en" value={value} onValueChange={setValue} required />
</Form>`,
        },
        {
            name: "Written from outside",
            description:
                "Controlled, so an agent or a parent writes value as an E.164 string. The input shows the national number and the picker follows to its country.",
            render: () => <ExternalWriteExample />,
            code: `<PhoneInput label="Contact" locale="en" value={value} onValueChange={setValue} />
<Button onClick={() => setValue("+442079460958")}>Write +442079460958</Button>`,
        },
        {
            name: "Right-to-left",
            description:
                "The label, the picker and the list follow the page: under dir=\"rtl\" the picker sits on the right. The number itself is dir=\"ltr\", so the + and the digits keep their order and stay isolated from the text around them. Arabic-Indic, Persian and other script digits are read as digits.",
            render: () => <RtlExample />,
            code: `<div dir="rtl" lang="ar">
    <PhoneInput label="رقم الهاتف" locale="ar" defaultCountry="EG" value={value} onValueChange={setValue} />
</div>`,
        },
    ],
    props: [
        { name: "value", type: `string | null`, default: "—", description: "The number in E.164, or `null`." },
        { name: "defaultValue", type: `string | null`, default: `null`, description: "Starting value when uncontrolled." },
        {
            name: "onValueChange",
            type: `(value: string | null, detail: PhoneInputDetail) => void`,
            default: "—",
            description: "Called when the value or the reading of it changes. `detail` is plain JSON: `country`, `dialCode`, `nationalNumber`, `valid`, `reason`, `approximate`.",
        },
        { name: "label", type: `string`, default: "—", description: "Visible label for the number.", required: true },
        { name: "defaultCountry", type: `string`, default: "—", description: "ISO 3166-1 alpha-2 selected at first. Also the tie-break for a shared dial code." },
        { name: "countries", type: `string[]`, default: "every country, by name", description: "Restrict the picker to these ISO codes, in this order." },
        { name: "locale", type: `string`, default: "the browser's", description: "Locale for country names. Pass it when you render on the server, or the names can differ between server and browser." },
        { name: "messages", type: `PhoneInputMessages`, default: "English", description: "Every piece of text the component shows, for another language. `{country}` is replaced with the country's name." },
        { name: "name", type: `string`, default: "—", description: "Posts the E.164 (or `\"\"`) through a hidden input." },
        { name: "description, error", type: `string`, default: "—", description: "Help text and your own message, tied to the number with `aria-describedby`." },
        { name: "required, disabled, placeholder, autoFocus, id, form, className, onBlur", type: "—", default: "—", description: "As usual. `id` is the number input's." },
    ],
    notes: (
        <Text size="xs">
            <code>reason</code> is one of <code>too_short</code>, <code>too_long</code>, <code>invalid_chars</code>{" "}
            or <code>unknown_country</code>. <code>invalid_chars</code> and <code>too_long</code> show at once;{" "}
            <code>too_short</code> and <code>unknown_country</code> show when focus leaves. Real per-country lengths
            apply only to rows checked against a cited numbering plan (<code>PHONE_COUNTRIES[i].lengthVerified</code>);
            every other country accepts 4 to 15 digits including its dial code, so a real number is never refused.
            Handles: <code>[data-react-fancy-phone-input]</code> (with <code>data-country</code>,{" "}
            <code>data-valid</code>, <code>data-reason</code>) plus <code>-country</code>, <code>-number</code>,{" "}
            <code>-error</code>, <code>-search</code>, <code>-listbox</code> and <code>-option</code>.{" "}
            <code>parsePhone(text, {"{ country, countries }"})</code> reads a number the same way the field does, for
            an agent or a server. Flags are regional-indicator letters, which Windows shows as the two-letter code.
            Import from the barrel or the <code>./phone-input</code> subpath.
        </Text>
    ),
};
