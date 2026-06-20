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

  // Gate on the RUNTIME broadcasting driver (server-rendered into a meta by
  // showcase-app.blade.php), not just the build-time VITE_* keys: only wire Echo
  // when the server actually broadcasts over Reverb. A build that carries
  // VITE_REVERB_APP_KEY would otherwise open a `wss://` connection even on an
  // environment whose BROADCAST_CONNECTION is null/log — dialing nothing.
  const driver = document.querySelector('meta[name="broadcasting-driver"]')?.getAttribute("content");
  if (driver !== "reverb") return null;

  const key = import.meta.env.VITE_REVERB_APP_KEY as string | undefined;
  if (!key) return null; // broadcasting not configured — stay inert

  (window as unknown as { Pusher: typeof Pusher }).Pusher = Pusher;

  const host = import.meta.env.VITE_REVERB_HOST as string | undefined;
  const loopback = host === "localhost" || host === "127.0.0.1";
  // A secure (https) page may only open a SECURE socket to a REMOTE host — a
  // remote `ws://…:80` is mixed-content-blocked by the browser. So force wss for
  // a remote host on an https page even if VITE_REVERB_SCHEME is stale/unset;
  // loopback (local-dev Reverb, plaintext on :8080) stays exactly as configured.
  const forceTLS =
    (import.meta.env.VITE_REVERB_SCHEME ?? "http") === "https" ||
    (window.location.protocol === "https:" && !loopback);
  const wsPort = Number(import.meta.env.VITE_REVERB_PORT ?? 8080);
  // wss MUST terminate on a TLS port — never plaintext 80. Coerce a stale :80 to
  // the standard 443 when forcing TLS (the public wss endpoint is nginx on 443,
  // proxying to the internal Reverb daemon on REVERB_SERVER_PORT).
  const wssPort = forceTLS && wsPort === 80 ? 443 : wsPort;

  cached = new Echo({
    broadcaster: "reverb",
    key,
    wsHost: host,
    wsPort,
    wssPort,
    forceTLS,
    enabledTransports: ["ws", "wss"],
    authEndpoint: "/broadcasting/auth",
  }) as unknown as EchoLike;

  return cached;
}
