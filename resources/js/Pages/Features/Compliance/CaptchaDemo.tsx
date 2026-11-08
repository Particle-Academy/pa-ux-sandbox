import { useState } from "react";
import { useForm, usePage } from "@inertiajs/react";
import { Badge, Button, Callout, Icon, Text, Textarea } from "@particle-academy/react-fancy";
import { Captcha, captchaData, type CaptchaConfig, type CaptchaStatus } from "@particle-academy/fancy-captcha-ui";

/** The route's middleware is `captcha:feature-demo`; the component's action must match it. */
export const CAPTCHA_DEMO_ACTION = "feature-demo";
export const CAPTCHA_DEMO_URL = "/features/compliance/captcha";

type Outcome = { ok: true } | { ok: false; message: string };

/**
 * fancy-captcha-ui's real `<Captcha>` in a real form, checked by fancy-captcha's
 * real middleware on the server. The config is the `fancyCaptcha` prop the
 * PHP package shares with every page; this site turns proof-of-work on
 * (config/fancy-captcha.php), so the built-in mode solves a fresh challenge in
 * a Web Worker. The route only redirects back: nothing posted is stored.
 */
export function CaptchaDemo() {
    const { fancyCaptcha } = usePage<{ fancyCaptcha: CaptchaConfig }>().props;
    const form = useForm<Record<string, string>>({ message: "", ...captchaData(fancyCaptcha) });
    const [status, setStatus] = useState<CaptchaStatus>("idle");
    const [outcome, setOutcome] = useState<Outcome | null>(null);

    const submit = () => {
        setOutcome(null);
        form.post(CAPTCHA_DEMO_URL, {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => setOutcome({ ok: true }),
            onError: (errors) => setOutcome({ ok: false, message: errors.captcha ?? Object.values(errors)[0] ?? "Refused." }),
        });
    };

    return (
        <form
            className="cmp-captcha"
            data-cmp-demo="captcha"
            onSubmit={(event) => {
                event.preventDefault();
                submit();
            }}
        >
            <Textarea
                label="Message"
                description="Not stored: the demo route only answers whether the check passed."
                value={form.data.message ?? ""}
                onValueChange={(value: string) => form.setData("message", value)}
                minRows={3}
            />

            <Captcha config={fancyCaptcha} form={form} action={CAPTCHA_DEMO_ACTION} onStatusChange={setStatus} id="cmp-captcha" />

            <div className="cmp-captcha__bar">
                <Button type="submit" icon="send" disabled={form.processing}>
                    Send
                </Button>
                <Text as="span" size="sm" color="muted">
                    Captcha status
                </Text>
                <Badge variant="outline" data-cmp-captcha-status={status}>
                    {status}
                </Badge>
                <Badge variant="soft">{fancyCaptcha.provider}</Badge>
            </div>

            {outcome?.ok === true && (
                <Callout color="green" icon={<Icon name="circle-check" size="sm" />}>
                    The server's check passed. A second send re-arms first: the solution just posted is spent.
                </Callout>
            )}
            {outcome?.ok === false && (
                <Callout color="red" icon={<Icon name="circle-x" size="sm" />}>
                    Refused: {outcome.message}
                </Callout>
            )}
        </form>
    );
}
