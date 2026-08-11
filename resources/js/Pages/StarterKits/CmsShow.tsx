import type { ReactElement } from "react";
import { Head } from "@inertiajs/react";
import { CmsPage } from "@particle-academy/fancy-cms-ui/react";
import { Layout } from "../Layout";
import { starterKitDoc } from "../../cms/starter-kit-seed";
import { makeStarterKitRegistry } from "../../cms/starter-kit-registry";
import { ReactDashboardKit } from "./kits/ReactDashboardKit";
import { WorkflowStudioKit } from "./kits/WorkflowStudioKit";
import { CollabBoardKit } from "./kits/CollabBoardKit";
import { EmbeddedIdeKit } from "./kits/EmbeddedIdeKit";
import { SpreadsheetStudioKit } from "./kits/SpreadsheetStudioKit";
import { DiagramStudioKit } from "./kits/DiagramStudioKit";
import { RealtimeChatKit } from "./kits/RealtimeChatKit";
import { ShopNSubKit } from "./kits/ShopNSubKit";

type Kit = { slug: string; name: string; pkg: string; blurb: string };

const KITS: Record<string, () => ReactElement> = {
  "fancy-query": RealtimeChatKit,
  "react-fancy": ReactDashboardKit,
  "fancy-flow": WorkflowStudioKit,
  "fancy-whiteboard": CollabBoardKit,
  "fancy-code": EmbeddedIdeKit,
  "fancy-sheets": SpreadsheetStudioKit,
  "fancy-echarts": DiagramStudioKit,
  "shop-n-sub": ShopNSubKit,
};

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function installCommandFor(slug: string): string {
  return `curl -L https://ui.particle.academy/starter-kits/${slug}/download.zip -o ${slug}.zip && unzip ${slug}.zip && cd ${slug}-starter && npm install && npm run dev`;
}

/**
 * `/starter-kits/{slug}/cms` — the same page as `StarterKits/Show`, authored as
 * a CMS document instead of as JSX.
 *
 * The second beachhead surface for the Stages model. Unlike the CMS home page,
 * almost nothing here is an island: the heading, blurb, provenance line, install
 * card and its command are all CMS primitives, and every kit-specific value
 * reaches them through a `{ $bind }`. One document therefore renders all eight
 * kits — which is the property a hand-written page cannot claim, and the reason
 * this is worth having as a demo rather than just as a proof.
 *
 * Bindings are computed HERE rather than written into the document for the same
 * reason the CMS home page's hero facts are: a value typed into a document is a
 * value nothing can keep true.
 */
export default function StarterKitsCmsShow({ kit }: { kit: Kit }) {
  const KitDemo = KITS[kit.slug];
  const installCommand = installCommandFor(kit.slug);

  return (
    <Layout>
      <Head title={`${kit.name} · Starter Kit (CMS)`} />

      <CmsPage
        doc={starterKitDoc}
        registry={makeStarterKitRegistry({
          installCommand,
          demoTitle: `localhost:5173 · ${kit.name}`,
          demo: KitDemo ? <KitDemo /> : null,
        })}
        data={{
          kit,
          installCommand,

          crumbsHtml:
            `<a href="/starter-kits" class="hover:underline">Starter Kits</a>` +
            `<span class="mx-1.5 text-zinc-400" aria-hidden="true">›</span>` +
            `<span class="text-zinc-700 dark:text-zinc-200">${escapeHtml(kit.name)}</span>`,

          titleHtml:
            `<h1 class="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">${escapeHtml(kit.name)}</h1>` +
            `<span class="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-700 dark:bg-violet-500/15 dark:text-violet-300">starter kit</span>`,

          builtWithHtml:
            `built with <a href="/packages/${encodeURIComponent(kit.pkg)}" class="font-medium text-violet-500 hover:underline">${escapeHtml(kit.pkg)}</a>`,

          downloadHtml:
            `<a href="/starter-kits/${encodeURIComponent(kit.slug)}/download.zip" ` +
            `class="inline-flex items-center gap-1.5 rounded-md bg-violet-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-violet-700">` +
            `<span aria-hidden="true">↓</span> Download zip</a>`,

          installNoteHtml:
            `Self-contained Vite + React 19 + Tailwind v4 project. ~12 KB. Edit ` +
            `<code class="rounded bg-zinc-100 px-1 font-mono text-[10px] dark:bg-zinc-800">src/Kit.tsx</code> to make it yours. MIT.`,
        }}
      />
    </Layout>
  );
}
