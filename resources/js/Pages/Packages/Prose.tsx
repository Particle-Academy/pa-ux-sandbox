/**
 * Renders server-rendered Markdown HTML (e.g. a package README) with the same
 * editorial styling as the docs pages, plus h1 + image handling that READMEs
 * lean on. The <style> is global once mounted; a single instance per page.
 */
export function Prose({ html }: { html: string }) {
    return (
        <>
            <div className="md-prose" dangerouslySetInnerHTML={{ __html: html }} />
            <style>{`
                .md-prose { color: rgb(63 63 70); line-height: 1.7; font-size: 0.95rem; word-wrap: break-word; }
                .dark .md-prose { color: rgb(212 212 216); }
                .md-prose > :first-child { margin-top: 0; }
                .md-prose h1 { font-size: 1.875rem; font-weight: 700; margin-top: 2rem; margin-bottom: 0.75rem; color: rgb(24 24 27); letter-spacing: -0.02em; }
                .dark .md-prose h1 { color: rgb(244 244 245); }
                .md-prose h2 { font-size: 1.5rem; font-weight: 600; margin-top: 2.5rem; margin-bottom: 0.5rem; color: rgb(24 24 27); letter-spacing: -0.01em; border-bottom: 1px solid rgb(228 228 231); padding-bottom: 0.3rem; }
                .dark .md-prose h2 { color: rgb(244 244 245); border-color: rgb(39 39 42); }
                .md-prose h3 { font-size: 1.125rem; font-weight: 600; margin-top: 2rem; margin-bottom: 0.5rem; color: rgb(24 24 27); }
                .dark .md-prose h3 { color: rgb(244 244 245); }
                .md-prose h4 { font-size: 0.95rem; font-weight: 600; margin-top: 1.5rem; margin-bottom: 0.25rem; color: rgb(24 24 27); }
                .dark .md-prose h4 { color: rgb(244 244 245); }
                .md-prose p { margin-top: 0.75rem; margin-bottom: 0.75rem; }
                .md-prose strong { font-weight: 600; color: rgb(24 24 27); }
                .dark .md-prose strong { color: rgb(244 244 245); }
                .md-prose ul { list-style: disc; padding-left: 1.5rem; margin: 0.75rem 0; }
                .md-prose ol { list-style: decimal; padding-left: 1.5rem; margin: 0.75rem 0; }
                .md-prose li { margin: 0.25rem 0; }
                .md-prose a { color: rgb(124 58 237); text-decoration: underline; text-underline-offset: 3px; }
                .dark .md-prose a { color: rgb(196 181 253); }
                .md-prose img { max-width: 100%; height: auto; border-radius: 0.5rem; margin: 0.5rem 0; }
                .md-prose code { background: rgb(244 244 245); padding: 0.1em 0.35em; border-radius: 0.25rem; font-family: ui-monospace, monospace; font-size: 0.85em; color: rgb(63 63 70); }
                .dark .md-prose code { background: rgb(39 39 42); color: rgb(228 228 231); }
                .md-prose pre { background: rgb(9 9 11); color: rgb(244 244 245); padding: 1rem 1.25rem; border-radius: 0.5rem; overflow-x: auto; font-family: ui-monospace, monospace; font-size: 0.85em; line-height: 1.55; margin: 1rem 0; }
                .md-prose pre code { background: transparent; padding: 0; color: inherit; font-size: inherit; }
                .md-prose blockquote { border-left: 3px solid rgb(167 139 250); padding-left: 1rem; margin: 1rem 0; color: rgb(82 82 91); font-style: italic; }
                .dark .md-prose blockquote { color: rgb(161 161 170); border-color: rgb(124 58 237); }
                .md-prose table { width: 100%; border-collapse: collapse; margin: 1rem 0; font-size: 0.9em; display: block; overflow-x: auto; }
                .md-prose th, .md-prose td { border: 1px solid rgb(228 228 231); padding: 0.5rem 0.75rem; text-align: left; }
                .dark .md-prose th, .dark .md-prose td { border-color: rgb(39 39 42); }
                .md-prose th { background: rgb(250 250 250); font-weight: 600; }
                .dark .md-prose th { background: rgb(24 24 27); }
                .md-prose hr { border: 0; border-top: 1px solid rgb(228 228 231); margin: 2rem 0; }
                .dark .md-prose hr { border-color: rgb(39 39 42); }
            `}</style>
        </>
    );
}
