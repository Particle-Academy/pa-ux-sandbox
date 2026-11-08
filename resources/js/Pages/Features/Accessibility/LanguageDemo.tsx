import { useEffect, useRef, useState } from "react";
import { Badge, Select, Text } from "@particle-academy/react-fancy";

/**
 * A language switcher that names each language in itself. Each option carries
 * its own `lang` (and `dir` for a right-to-left script), the react-fancy 6.13
 * per-option attributes, so a screen reader switches voice for each label
 * instead of reading Russian or Arabic with English rules.
 */
export const LANGUAGE_OPTIONS = [
    { value: "en", label: "English", lang: "en" },
    { value: "es", label: "Español", lang: "es" },
    { value: "de", label: "Deutsch", lang: "de" },
    { value: "ru", label: "Русский", lang: "ru" },
    { value: "zh", label: "中文", lang: "zh" },
    { value: "hi", label: "हिन्दी", lang: "hi" },
    { value: "ar", label: "العربية", lang: "ar", dir: "rtl" as const },
];

export function LanguageDemo() {
    const root = useRef<HTMLDivElement>(null);
    const [value, setValue] = useState("ar");
    const [rendered, setRendered] = useState({ lang: "", dir: "" });

    useEffect(() => {
        const option = root.current?.querySelector<HTMLSelectElement>("select")?.selectedOptions[0];
        setRendered({ lang: option?.getAttribute("lang") ?? "", dir: option?.getAttribute("dir") ?? "" });
    }, [value]);

    return (
        <div ref={root} className="a11y-language" data-a11y-demo="language">
            <div className="a11y-language__field">
                <Select label="Language" list={LANGUAGE_OPTIONS} value={value} onValueChange={setValue} />
            </div>
            <div className="a11y-readout">
                <Text as="span" size="sm" color="muted">
                    The chosen option, as rendered
                </Text>
                <code className="feature-code" data-a11y-option-lang={rendered.lang}>
                    {`<option lang="${rendered.lang}"${rendered.dir ? ` dir="${rendered.dir}"` : ""}>`}
                </code>
                {rendered.dir === "rtl" && (
                    <Badge color="indigo" variant="soft">
                        right to left inside a left-to-right page
                    </Badge>
                )}
            </div>
        </div>
    );
}
