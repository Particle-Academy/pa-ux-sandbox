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

  const forceTLS = (import.meta.env.VITE_REVERB_SCHEME ?? "http") === "https";
  const wsPort = Number(import.meta.env.VITE_REVERB_PORT ?? 8080);
  // A secure socket (wss) MUST terminate at a TLS port. Port 80 is plaintext
  // HTTP — never valid for wss. A Forge env with VITE_REVERB_PORT=80 + https
  // made prod dial `wss://host:80`, so the TLS handshake hit a plaintext port
  // and EVERY Echo connection failed → agent presence / co-browse went dark.
  // Coerce the secure port to the standard 443 in that case; honor any other
  // explicit port (e.g. local Reverb on 8080). The real public WSS endpoint must
  // still exist server-side: nginx serving wss on 443 for VITE_REVERB_HOST →
  // the Reverb daemon (REVERB_PORT, internal).
  const wssPort = forceTLS && wsPort === 80 ? 443 : wsPort;

  cached = new Echo({
    broadcaster: "reverb",
    key,
    wsHost: import.meta.env.VITE_REVERB_HOST,
    wsPort,
    wssPort,
    forceTLS,
    enabledTransports: ["ws", "wss"],
    authEndpoint: "/broadcasting/auth",
  }) as unknown as EchoLike;

  return cached;
}
