# Fancy TUI docs render service

The terminal behind **/fancy-tui**. It renders the **real**
`@particle-academy/fancy-tui` Ink components as a single, live, focused
showcase: every one of the package's components, browsable from the keyboard,
with a **live** preview beside each.

It exists as a separate Node process because **Ink runs in Node, not the
browser**, and it must never touch the Inertia SSR daemon (that is kit
machinery; a leak here must not blank the site's first paint).

Because it can run Ink, a preview is a **live render**, not a picture. The whole
docs UI is **one persistent Ink app per viewer** (`src/app.tsx`): it imports
`@particle-academy/fancy-tui/showcase` — `SHOWCASE_EXAMPLES` — holds its own
selection in React state, and puts the selected example's `node` straight into
its own tree, laid out by Yoga at the visitor's real terminal size. Self-animating
components (Spinner, ActivityIndicator) animate; interactive ones (Input,
Accordion) respond to keys. No MCP, no registry, no catalogue — just the
components.

## What it is

A single live session behind HTTP:

```
POST /session   { action: "start", cols, rows }        -> { id, seq, frame, effects }
POST /session   { action: "key",   id, key }           -> { id, seq, frame, effects }
POST /session   { action: "end",   id }                -> { ended }
GET  /session/stream?id=<id>&since=<seq>               -> { seq, frame, effects }  (long-poll)
```

- On open the browser starts **one** session, streams its frames over a
  long-poll (so animation arrives without hammering), and forwards **every**
  keystroke. The app holds all navigation state server-side in a live React tree.
- `effects` carry app intents back to the browser (`quit` on `q`/Escape-at-root,
  `open` a URL). They ride the key response and the stream payload.
- It spawns **no** process and opens **no** PTY. Nothing user-supplied becomes a
  shell argument, a file path, or a query. A session is one of a FIXED set of app
  KINDS (`docs`); the service refuses anything else, clamps the terminal size, and
  caps concurrent sessions with idle-TTL garbage collection.
- It binds `127.0.0.1` only. **Laravel is the public edge**
  (`/fancy-tui/session`) and applies throttling; this service trusts nothing on
  the way in regardless.

## The fixed-frame contract

The browser terminal has **no scrollback** (`scrollback={0}`): the app repaints a
full screen every frame, so a frame one row too tall pushes content off the top
irrecoverably. The app claims the full terminal (`Box height={rows}
overflow="hidden"`) so a frame can never exceed the grid — content clips rather
than overflows — and the layout budgets rows precisely so nothing important is
clipped. `tests/js/tui-service-fit.test.ts` renders the app **and every live
showcase preview** at eight terminal sizes and asserts both the fit and that the
selected component's name, live view, and source all survive.

Every frame line ends `\r\n` (`crlf()` in `render.tsx`) because xterm has no
ONLCR; a bare `\n` staircases the frame off the screen.

## Run it

```bash
# From the sandbox root:
npm run tui-service
```

Then point Laravel at it:

```dotenv
TUI_SERVICE_URL=http://127.0.0.1:8790
```

With `TUI_SERVICE_URL` unset, `/fancy-tui` degrades to the HTML docs — the
terminal view shows a clean "not available here" notice rather than a dead
screen.

### Environment

| Variable | Default | Purpose |
|---|---|---|
| `TUI_SERVICE_PORT` | `8790` | Port to bind on `127.0.0.1`. |

Falls back to the app's `.env` when the variable is not in the real environment,
since `.env` is where `TUI_SERVICE_URL` already lives. A real env var always wins.

### On Forge

> **This never goes in the deploy script.** `npm run tui-service` starts a
> server that does not exit, so a deploy script containing it blocks forever and
> the deployment hangs until it times out. It belongs in Forge's **Daemons**
> section, which is supervised and restarts it on crash.

Create a Forge **Daemon**:

| Field | Value |
|---|---|
| Command | `node --import tsx tui-service/src/server.ts` |
| Directory | `/home/forge/<site>/current` (or `$FORGE_SITE_PATH`) |
| User | `forge` |

**Not `npm run tui-service` in production.** That goes through `run.mjs`, which
spawns the server as a child (a launcher that forwards `SIGTERM`/`SIGINT`/`SIGHUP`
for the local case). In production it only buys you a process tree
`supervisor → npm → node → node`, and if a signal fails to reach the bottom the
real server survives `supervisorctl restart` still holding port 8790. The command
above runs the server *as* the supervised process, so there is no tree to orphan.

Then set `TUI_SERVICE_URL` to `http://127.0.0.1:8790` in the site env. No build
step: it runs through `tsx`.

**One line does belong in the deploy script** — restarting the daemon so it picks
up the new release (a daemon launched in `current` keeps serving the old release,
because `current` is a symlink that moves out from under the running process):

```bash
sudo -S supervisorctl restart daemon-<id>:*
```

Forge prints that command with the real `<id>` on the daemon's page. It returns
immediately, so it cannot hang a deploy.

`tsx` is a **devDependency**, so the deploy must install dev dependencies — it
already does, since `vite` is a devDependency too and the deploy runs
`npm run build`. Adding `--omit=dev` would break this daemon and the asset build.

## Layout

| File | Role |
|---|---|
| `src/server.ts` | HTTP server: `/session` (start/key/end) + `/session/stream` long-poll. |
| `src/session.tsx` | `SessionManager` + one live Ink app per session — cap, idle-TTL GC, allow-list, the stdin contract that delivers keys, and the frame/effect stream. |
| `src/app.tsx` | The whole docs UI as one stateful Ink app, composed from real fancy-tui components. |
| `src/render.tsx` | One-shot render (for tests) + the `crlf()` frame helper. |
| `src/state.ts` | Clamps the untrusted terminal size from the browser. |
| `run.mjs` | Local launcher (spawns the server, forwards signals). |

Covered by `tests/js/tui-service-*.test.ts` in the sandbox suite:
`tui-service-app` (the list is exactly the showcase; selecting shows source),
`tui-service-fit` (the frame fits at eight sizes), `tui-service-render` (CRLF),
and `tui-service-session` (the allow-list, animation, input reaching the focused
component, and the resource fence).
