import Echo from "laravel-echo";
import Pusher from "pusher-js";
import type { EchoLike } from "@particle-academy/fancy-query";

let cached: EchoLike | null = null;

/**
 * Lazy, browser-only Laravel Echo singleton pointed at Reverb.
 *
 * Window-guarded: returns `null` under SSR (the node render process has no
 * `window`/WebSocket) so it can be called unconditionally from the shared
 * provider tree in both `showcase-app.tsx` and `ssr.tsx` without diverging the
 * tree shape (both pass the result to `<FancyDataRoot echo>`; it's just `null`
 * on the server). Never construct `Pusher`/`Echo` at module-eval — that would
 * crash the SSR bundle.
 */
export function getEcho(): EchoLike | null {
  if (typeof window === "undefined") return null;
  if (cached) return cached;

  const key = import.meta.env.VITE_REVERB_APP_KEY as string | undefined;
  if (!key) return null; // broadcasting not configured — stay inert

  (window as unknown as { Pusher: typeof Pusher }).Pusher = Pusher;

  cached = new Echo({
    broadcaster: "reverb",
    key,
    wsHost: import.meta.env.VITE_REVERB_HOST,
    wsPort: Number(import.meta.env.VITE_REVERB_PORT ?? 8080),
    wssPort: Number(import.meta.env.VITE_REVERB_PORT ?? 443),
    forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? "http") === "https",
    enabledTransports: ["ws", "wss"],
    authEndpoint: "/broadcasting/auth",
  }) as unknown as EchoLike;

  return cached;
}
