Two version numbers exist in Fancy UI and they measure different things. Knowing which one someone means is most of understanding this page.

- **A package version** — `react-fancy@4.19.1`, `fancy-flow@0.36.0`. Each package is released on its own schedule, and they are not expected to agree with each other.
- **The kit version** — the one in the footer of this page, and in the table below. The set of package releases that shipped and were **tested together**. It is what this site is built from.

So packages sitting on different numbers is not drift. The kit tag is what makes a coherent set out of them, and it is the number to quote when you say which Fancy UI you are on.

## Supported versions

<!--SUPPORT_TABLE-->

**A line's clock starts when its successor ships**, not when it was released. After that:

- **Bug fixes for 6 months.** Reported defects are fixed on the maintenance branch and released as a patch.
- **Security fixes for 12 months.** After the bug-fix window closes, the line keeps receiving security patches only, for another six months.
- **End of life** after that. Nothing further is released. The line stays installable — published versions are never unpublished — but nothing new lands on it.

Anything older than v0.4 is end of life.

## How a line is maintained

When a new kit version merges to `main`, every repo the outgoing line was built from gets a **maintenance branch** named for that line (`0.4`). Fixes land on `main` first and are **backported** to the branch, then released as a patch on that line.

That means a patch release on a maintenance line contains fixes and nothing else — no new features, no dependency bumps beyond what a security fix requires. Upgrading within a line should never be a decision you have to think about.

## Docs for older versions

The docs you are reading describe the **current** kit version. Use the version selector at the top of the sidebar to read the docs for a supported older line; any page outside the current version says so at the top.

Docs for a maintenance line are frozen at the cut, because the software they describe has stopped changing. If one is wrong, it can still be corrected — report it and the fix lands in that version's docs.

## Registry and MCP

The [registry](/docs/registry) and the [MCP server](/docs/mcp) both understand kit versions. Ask either for a specific version and you get only what existed in it:

```
GET /r/index.json?version=0.4
```

Items carry `since` and `until`. An item with neither has been present in every version; `until` marks something that was removed, so a consumer on an older line is not offered a component that no longer exists — and an agent working in your app is not told about an API it cannot call.

## Deprecation

Removal is a separate promise from end of life, and the two get conflated.

Before an API is removed it is **deprecated** for at least one kit version: it keeps working, it is marked `@deprecated` with the replacement named, and the changelog says what to do. Removal happens no earlier than the next kit version after that.

Pre-1.0 packages land breaking changes in minor releases — the version number cannot carry that promise on its own, which is why every package's changelog marks breaking entries and pairs each one with the action a consumer has to take.

## Reporting against a version

When you report a bug, say which **kit** version you are on — the number in the footer — as well as the package version. A fix for a supported line is backported; a fix for an end-of-life line is not, and knowing which you are on is the difference between a patch and an upgrade.
