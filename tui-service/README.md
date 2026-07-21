# Fancy Docs TUI render service

The terminal behind **/fancy-tui**. It renders the **real** `@particle-academy/fancy-tui`
Ink components and browses the **real** Fancy UI MCP server — the same
`list-components` / `get-component` an agent calls.

It exists as a separate Node process because **Ink runs in Node, not the
browser**, and it must never touch the Inertia SSR daemon (that is kit
machinery; a leak here must not blank the site's first paint).

Because it can run Ink, a component preview is a **live render**, not a
picture: the detail pane imports `@particle-academy/fancy-tui/showcase` and puts
the example's `node` straight into its own tree, so the component is laid out by
Yoga at the visitor's real terminal size. `showcase/previews.json` is still read,
but only as a fallback — for the two examples that commit scrollback through
Ink's `<Static>` (`MessageList`, `StaticList`), whose output is written above the
frame and outside the box model where no pane can clip it.

## What it is

A pure function behind HTTP:

```
POST /render   { state, key?, cols, rows }  ->  { state, frame, effects }
```

- The **browser owns the navigation state** and sends it back with each
  keystroke, so the service holds **no session**.
- It spawns **no process** and opens **no PTY**. Nothing user-supplied becomes a
  shell argument, a file path, or a query — the reducer only walks an in-memory
  catalogue, and incoming state is sanitised (`src/state.ts`) before use.
- It binds `127.0.0.1` only. **Laravel is the public edge** (`/fancy-tui/frame`)
  and applies throttling; this service trusts nothing on the way in regardless.
- Its MCP client is **read-only by construction** (`src/mcp.ts`): it can only
  call the list/search/get tools, never a mutating one.

## Run it

```bash
# From the sandbox root:
TUI_MCP_URL=http://127.0.0.1:8000/mcp npm run tui-service
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
| `TUI_MCP_URL` | `http://127.0.0.1:8000/mcp` | The MCP endpoint to browse — this app's own `/mcp`. |

Both fall back to the app's `.env` when the variable is not in the real
environment, since `.env` is where `TUI_SERVICE_URL` already lives and so where
anyone configuring this naturally puts them. A real env var always wins.

### Local HTTPS (Herd / Valet) — handled for you

The default assumes `php artisan serve` on port 8000. Serving the app over Herd
or Valet instead means `TUI_MCP_URL` is an `https://…test` URL, and **Node does
not trust the local CA** — the fetch fails with `UNABLE_TO_VERIFY_LEAF_SIGNATURE`,
which reaches the terminal as the unhelpful `Could not reach the registry: fetch
failed`. Plain `http://` does not save you; Valet 301s it to https.

`npm run tui-service` goes through `run.mjs`, which handles this: when
`TUI_MCP_URL` is an https `.test` (or `localhost`) host it finds the Herd/Valet
CA and sets `NODE_EXTRA_CA_CERTS` before starting the service. It exists as a
launcher because Node reads that variable at STARTUP — the service cannot fix
its own trust from the inside.

It supplies the correct trust anchor; it never disables verification. And the
detection is scoped to `.test`/`localhost` over https, so **a deployed app never
triggers any of it** — real certificate, straight through. Override with
`TUI_MCP_CA_FILE` (env or `.env`) for a CA elsewhere, or set
`NODE_EXTRA_CA_CERTS` yourself and the launcher defers to it.

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
spawns the server as a child so it can set `NODE_EXTRA_CA_CERTS` first — a local
concern that never applies to a deployed app. In production it only buys you a
process tree: `supervisor → npm → node → node`. Supervisor signals the top of
that tree, and if a signal fails to reach the bottom, the real server survives
`supervisorctl restart` still holding port 8790 — supervisor reports success,
the old code keeps serving, and the deploy silently does nothing.

The command above runs the server *as* the supervised process, so there is no
tree to traverse and nothing to orphan. (`run.mjs` does forward `SIGTERM`/
`SIGINT`/`SIGHUP` for the local case, but not needing the forwarding at all is
better than depending on it.)

If a deployed app ever does need a custom CA, set `NODE_EXTRA_CA_CERTS` in the
daemon's environment rather than reaching for the launcher.

Then set `TUI_MCP_URL` to the app's own `/mcp` and `TUI_SERVICE_URL` to
`http://127.0.0.1:8790` in the site env. No build step: it runs through `tsx`.

**One line does belong in the deploy script** — restarting the daemon, so it
picks up the new release. A daemon launched in `current` keeps serving the old
release after a deploy, because `current` is a symlink that moves out from under
the running process:

```bash
sudo -S supervisorctl restart daemon-<id>:*
```

Forge prints that command with the real `<id>` on the daemon's own page. It
returns immediately, so it cannot hang a deploy the way the service itself does.

`tsx` is a **devDependency**, so the deploy must install dev dependencies — it
already does, since `vite` is a devDependency too and the deploy runs
`npm run build`. Adding `--omit=dev` would break this daemon and the asset build
together.

## Layout

| File | Role |
|---|---|
| `src/server.ts` | HTTP server; the `(state,key,size) -> (state,frame,effects)` seam. |
| `src/mcp.ts` | Minimal read-only MCP client (initialize + `tools/call`). |
| `src/catalogue.ts` | Fetches + caches the catalogue; groups by family/theme; resolves each component's showcase slug. |
| `src/model.ts` | Pure reducer — the whole navigation. |
| `src/app.tsx` | The real fancy-tui Ink components for each pane. |
| `src/render.tsx` | Drives Ink at a specific terminal size → one ANSI frame. |
| `src/state.ts` | Sanitises untrusted state + size from the browser. |
| `src/keys.ts` | Decodes raw xterm bytes into keys. |

Pure logic (`model`, `keys`, `state`, `catalogue`) is covered by
`tests/js/tui-service-*.test.ts` in the sandbox suite. `tui-service-fit.test.ts`
additionally renders the home pane AND the detail pane — with every live
showcase example — at eight terminal sizes and asserts the frame never exceeds
the rows or columns it was given. That is not a formality: this UI repaints a
full screen with no scrollback, so a frame one row too tall pushes content off
the top irrecoverably.
