// Empty stand-in for Node built-ins (e.g. `fs`) in the BROWSER build. Isomorphic
// deps like @particle-academy/dark-slide do a dynamic `import('fs')` inside a
// Node-only code path that never executes in the browser; resolving it here keeps
// it out of the bundle (and silences Vite's "externalized for browser
// compatibility" warning) without affecting the SSR build, where real `fs` stays.
export default {};
