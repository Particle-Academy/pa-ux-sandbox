# Deep Research

Vendored, provider-neutral deep research for fancy-flow. Install it with:

```bash
npx fancy-cli@latest add node @particle-academy/deep_research
```

The node does not depend on Prism, Perplexity, or any provider SDK. A host implements `DeepResearchHost` / registers `registerDeepResearchHost`, translating the neutral request into its provider call and returning `answer`, normalized `citations`, and optional provider/model/usage metadata.

This makes `prism-perplexity` a supported adapter without making it an installation requirement. Its adapter should map `depth: "deep"` to the package's deep-research mode, await any provider job/polling internally, and normalize citations into `{ url, title?, excerpt?, publishedAt? }`.

The `credential` config is a host-resolved reference, never a raw API key. Set `includeContext: false` when incoming run data must not leave the host.
