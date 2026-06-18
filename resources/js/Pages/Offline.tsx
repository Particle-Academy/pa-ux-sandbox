import { Head, router } from "@inertiajs/react";
import { Button, Callout } from "@particle-academy/react-fancy";
import { Layout } from "./Layout";

/**
 * Offline fallback. The service worker serves this page (via offlineFallback
 * in resources/js/sw.ts) when a navigation can't reach the network. Kept
 * minimal so it renders from cache without any data dependencies.
 */
export default function Offline() {
    return (
        <Layout>
            <Head title="You're offline · Fancy UI" />
            <div className="mx-auto w-full max-w-xl py-16 text-center">
                <h1 className="mb-3 text-2xl font-semibold">You're offline</h1>
                <Callout color="amber">
                    This page isn't cached and we can't reach the network right now. Reconnect, then try again.
                </Callout>
                <div className="mt-6 flex justify-center gap-3">
                    <Button onClick={() => router.reload()}>Retry</Button>
                    <Button variant="ghost" onClick={() => router.visit("/")}>
                        Go home
                    </Button>
                </div>
            </div>
        </Layout>
    );
}
