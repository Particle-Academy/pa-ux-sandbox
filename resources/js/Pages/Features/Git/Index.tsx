import { Badge, Skeleton, Text } from "@particle-academy/react-fancy";
import { clientOnly } from "@/lib/clientOnly";
import { DemoFrame } from "../shared/DemoFrame";
import { FeatureCta } from "../shared/FeatureCta";
import { FeatureHero } from "../shared/FeatureHero";
import { FeatureShell } from "../shared/FeatureShell";
import { FeatureTour } from "../shared/FeatureTour";
import { HowItFits } from "../shared/HowItFits";
import { InstallSteps } from "../shared/InstallSteps";
import { PackagesGrid } from "../shared/PackagesGrid";
import type { FeaturePageProps } from "../shared/types";
import "./git.css";

/**
 * /features/git — Git as a surface a person and an agent share.
 *
 * The demo is the real fancy-git-ui components plus the real
 * `registerGitBridge`, both in the browser, over a seeded repository. It is
 * client-only because the bridge's MCP server lives in an effect and the
 * components have nothing useful to say before it mounts.
 */
const GitWorkbench = clientOnly(() => import("./GitWorkbench"), GitWorkbenchFallback);

function GitWorkbenchFallback() {
    return (
        <div className="git-bench git-bench--loading" aria-busy="true">
            <Skeleton className="git-bench__skeleton" />
            <Skeleton className="git-bench__skeleton git-bench__skeleton--side" />
        </div>
    );
}

export default function GitFeature({ feature, versions }: FeaturePageProps) {
    return (
        <FeatureShell feature={feature}>
            <FeatureHero
                feature={feature}
                eyebrow="$ git status --feature"
                title="Git that an agent can propose to"
                lede="One normalized contract for local Git and for GitHub, GitLab and Bitbucket, in PHP and in Node. A React UI that only renders what you pass it. Writes that arrive as proposals until a person confirms them."
                languages={feature.languages}
            >
                <div className="git-hero__lanes" aria-hidden>
                    <span className="git-hero__lane">
                        <Badge variant="soft" size="md">main</Badge>
                    </span>
                    <span className="git-hero__lane git-hero__lane--branch">
                        <Badge variant="soft" size="md">feature/trigger-cohorts</Badge>
                    </span>
                    <span className="git-hero__lane git-hero__lane--review">
                        <Badge variant="soft" size="md">proposed: git commit</Badge>
                    </span>
                </div>
            </FeatureHero>

            <DemoFrame
                label="fancy-git-ui + registerGitBridge"
                id="git"
                caption={
                    <>
                        Stage, commit and open a pull request as yourself; a checkout is proposed and waits for your Confirm. Then use the agent panel and let it propose the same things. Nothing runs git and nothing leaves this page: the repository is seeded data, and each intent is answered in local state.
                    </>
                }
            >
                <GitWorkbench />
            </DemoFrame>

            <FeatureTour
                title="What it does"
                intro={
                    <Text as="span">
                        Each claim below is checkable in the packages' own source and READMEs.
                    </Text>
                }
                items={[
                    {
                        icon: "network",
                        title: "One contract, three hosts",
                        body: "GitProvider normalizes identify, repository, listReviews, getReview, createReview, compare and checks. GitHubProvider, GitLabProvider and BitbucketProvider each implement it, so a pull request and a merge request are both a Review.",
                    },
                    {
                        icon: "languages",
                        title: "PHP and Node, mirrored",
                        body: "GitRepository runs the installed git binary from PHP (through Symfony Process) and from Node. Every provider adapter ships in both languages, and the core carries no GitHub, GitLab or Bitbucket SDK.",
                    },
                    {
                        icon: "hand",
                        title: "Proposal-first writes",
                        body: "Repository writes can return a JSON proposal instead of changing anything: pendingMode: \"propose\" in Node (stage, unstage, commit, checkout, fetch, pull, push) and propose: true in PHP (the same, less commit).",
                    },
                    {
                        icon: "bot",
                        title: "An agent bridge that asks first",
                        body: "registerGitBridge exposes git_status, git_log and git_diff to read, plus git_reviews_list and git_checks when your adapter supports them. Its write tools (git_stage through git_review_create) return proposals, and apply is refused unless the host opts in with allowApply.",
                    },
                    {
                        icon: "layout-panel-left",
                        title: "Controlled, provider-neutral UI",
                        body: "Eight components (WorkingTree, DiffViewer, CommitHistory, RepositoryBrowser, ReviewList, BranchPicker, CommitComposer, CreateReviewForm) take a value and emit intents. None calls git or a provider API, and each entity carries a stable data-git-* handle.",
                    },
                    {
                        icon: "git-compare",
                        title: "Diffs with a review state",
                        body: "DiffViewer takes the unified patch fancy-git returns, unified or split, with per-hunk accept and reject. A hunk with no decision is pending, which is not the same as rejected.",
                    },
                ]}
            />

            <HowItFits
                members={feature.members}
                bridges={feature.bridges}
                intro="The engine and every provider adapter ship as a PHP and Node pair; the UI is one React package that works with either backend."
            />
            <InstallSteps members={feature.members} versions={versions} intro="Install the engine for your backend, an adapter for each host you use, and the UI." />
            <PackagesGrid members={feature.members} versions={versions} />

            <FeatureCta
                title="Put a repository in front of a person and an agent"
                body="Start from fancy-git-ui's component pages: each one runs against a fixture repository, with the props it takes."
                primary={{ label: "fancy-git-ui", href: "/packages/fancy-git-ui" }}
                secondary={{ label: "The Node engine", href: "/packages/fancy-git-js" }}
            />
        </FeatureShell>
    );
}
