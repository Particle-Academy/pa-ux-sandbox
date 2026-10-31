import { createSocketEcho, type SocketAuthorization } from "@particle-academy/fancy-query/socket";
import type { EchoLike } from "@particle-academy/fancy-query";

let cached: EchoLike | null = null;

/**
 * Lazy, browser-only realtime client pointed at Reverb.
 *
 * Fancy's own Pusher-protocol client (`@particle-academy/fancy-query/socket`)
 * — no laravel-echo, no pusher-js. It implements FancyDataRoot's `EchoLike`
 * contract, including Laravel's `App.Events` namespace, so `useFancyStream` /
 * `useFancyEchoInvalidation` call sites read exactly as they would with Echo.
 * It connects only when the first channel is acquired, and reconnects with
 * capped backoff, re-authorizing private/presence channels with the new socket
 * id. Events missed while disconnected are not replayed: the overlay that uses
 * this today also polls its REST endpoint, which is how it recovers.
 *
 * Window-guarded: returns `null` under SSR (the node render process has no
 * `window`/WebSocket) so it can be called unconditionally from the shared
 * provider tree in both `showcase-app.tsx` and `ssr.tsx` without diverging the
 * tree shape (both pass the result to `<FancyDataRoot echo>`; it's just `null`
 * on the server).
 */
export function getEcho(): EchoLike | null {
  if (typeof window === "undefined") return null;
  if (cached) return cached;

  // Gate on the RUNTIME broadcasting driver (server-rendered into a meta by
  // showcase-app.blade.php), not just the build-time VITE_* keys: only wire the
  // socket when the server actually broadcasts over Reverb. A build that carries
  // VITE_REVERB_APP_KEY would otherwise open a `wss://` connection even on an
  // environment whose BROADCAST_CONNECTION is null/log — dialing nothing.
  const driver = document.querySelector('meta[name="broadcasting-driver"]')?.getAttribute("content");
  if (driver !== "reverb") return null;

  const key = import.meta.env.VITE_REVERB_APP_KEY as string | undefined;
  if (!key) return null; // broadcasting not configured — stay inert

  // Without a host there is nothing to dial (Echo would have fallen back to a
  // pusher.com cluster host, which is never right for Reverb).
  const host = import.meta.env.VITE_REVERB_HOST as string | undefined;
  if (!host) return null;

  const loopback = host === "localhost" || host === "127.0.0.1";
  // A secure (https) page may only open a SECURE socket to a REMOTE host — a
  // remote `ws://…:80` is mixed-content-blocked by the browser. So force wss for
  // a remote host on an https page even if VITE_REVERB_SCHEME is stale/unset;
  // loopback (local-dev Reverb, plaintext on :8080) stays exactly as configured.
  const forceTLS =
    (import.meta.env.VITE_REVERB_SCHEME ?? "http") === "https" ||
    (window.location.protocol === "https:" && !loopback);
  const configuredPort = Number(import.meta.env.VITE_REVERB_PORT ?? 8080);
  // wss MUST terminate on a TLS port — never plaintext 80. Coerce a stale :80 to
  // the standard 443 when forcing TLS (the public wss endpoint is nginx on 443,
  // proxying to the internal Reverb daemon on REVERB_SERVER_PORT).
  const port = forceTLS && configuredPort === 80 ? 443 : configuredPort;

  // Reverb serves the Pusher protocol at /app/{key}; the client appends the
  // protocol query (protocol=7 etc.) itself.
  const url = `${forceTLS ? "wss" : "ws"}://${host}:${port}/app/${encodeURIComponent(key)}`;

  cached = createSocketEcho({
    url,
    // Private + presence channels: Laravel's broadcasting auth route, with the
    // session cookie and the CSRF token from the page — what Echo sent.
    authorize: async ({ socketId, channelName }, signal): Promise<SocketAuthorization> => {
      const csrf = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? "";
      const response = await fetch("/broadcasting/auth", {
        method: "POST",
        credentials: "same-origin",
        signal,
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "X-CSRF-TOKEN": csrf,
          "X-Requested-With": "XMLHttpRequest",
        },
        body: JSON.stringify({ socket_id: socketId, channel_name: channelName }),
      });
      if (!response.ok) throw new Error(`Channel authorization refused (${response.status})`);
      return (await response.json()) as SocketAuthorization;
    },
  });

  return cached;
}
