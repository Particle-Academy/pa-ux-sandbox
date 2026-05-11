import { StrictMode, lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router";
import "./react-demos/setup-icons";
import { DreamingLayout } from "./dreaming/Layout";
import { Playground } from "./dreaming/pages/Playground";
import { Lobby } from "./dreaming/pages/Lobby";
import { DREAMS } from "./dreaming/manifest";

const Loading = () => (
  <div className="flex items-center justify-center py-20">
    <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-300 border-t-violet-500" />
  </div>
);

/**
 * Each dream registers a route under /dreaming/<slug>. The page file
 * must live at `dreaming/pages/<PascalSlug>Demo.tsx` and export a
 * component with the same name as the file (without `.tsx`).
 *
 * The dreaming loop both edits manifest.ts and creates the page file.
 */
const pascal = (slug: string) =>
  slug
    .split("-")
    .map((p) => p[0]?.toUpperCase() + p.slice(1))
    .join("");

const dreamRoutes = DREAMS.map((d) => {
  const name = `${pascal(d.slug)}Demo`;
  const Comp = lazy(() =>
    import(`./dreaming/pages/${name}.tsx`).then((m: any) => ({
      default: m[name] ?? m.default,
    })),
  );
  return { slug: d.slug, Comp };
});

const root = document.getElementById("dreaming");
if (root) {
  createRoot(root).render(
    <StrictMode>
      <BrowserRouter basename="/dreaming">
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route element={<DreamingLayout />}>
              <Route index element={<Playground />} />
              <Route path="lobby" element={<Lobby />} />
              {dreamRoutes.map(({ slug, Comp }) => (
                <Route key={slug} path={slug} element={<Comp />} />
              ))}
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </StrictMode>,
  );
}
