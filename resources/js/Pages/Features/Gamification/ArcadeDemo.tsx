import { useMemo, useState } from "react";
import { Avatar, Badge, Button, Heading, Icon, Progress, StatList, Table, Text } from "@particle-academy/react-fancy";
import { actionById, award, leaderboard, progressFor, seed, seededState, type FunLabEvent, type LeaderboardSort, type State } from "./funlab";

const METRIC_NAME: Record<string, string> = Object.fromEntries(seed.metrics.map((m) => [m.slug, m.name]));

function describe(event: FunLabEvent): string {
    switch (event.kind) {
        case "xp":
            return `+${event.amount} ${METRIC_NAME[event.metric]}`;
        case "level":
            return `${METRIC_NAME[event.metric]} reached level ${event.level}, ${event.name}`;
        case "achievement":
            return `Achievement unlocked: ${event.name}`;
    }
}

type FeedItem = { id: number; event: FunLabEvent };

/**
 * XP, levels, achievements and a leaderboard on seeded players, using
 * react-fancy's Progress, StatList, Table and Avatar. The rules are
 * laravel-fun-lab's (see funlab.ts), checked against the real engine in
 * GamificationFeatureTest.
 *
 * Progress bars change on every click, so each carries a written value
 * (aria-valuetext: "40 of 150 XP to Adept") rather than a bare percentage,
 * and level-ups and achievements are announced once through a polite live
 * region instead of the bar re-announcing on every change.
 */
export function ArcadeDemo() {
    const [state, setState] = useState<State>(() => seededState());
    const [feed, setFeed] = useState<FeedItem[]>([]);
    const [announcement, setAnnouncement] = useState("");
    const [sort, setSort] = useState<LeaderboardSort>("xp");

    const you = state[seed.you];
    const board = useMemo(() => leaderboard(state, sort), [state, sort]);
    const rank = useMemo(() => leaderboard(state, "xp").find((p) => p.id === seed.you)?.rank ?? 0, [state]);

    const act = (actionId: string) => {
        const action = actionById(actionId);
        const result = award(state, seed.you, action.metric, action.amount);
        setState(result.state);
        setFeed((items) => [...result.events.map((event, i) => ({ id: Date.now() + i, event })).reverse(), ...items].slice(0, 6));
        const notable = result.events.filter((e) => e.kind !== "xp").map(describe);
        if (notable.length > 0) setAnnouncement(notable.join(". ") + ".");
    };

    const reset = () => {
        setState(seededState());
        setFeed([]);
        setAnnouncement("Demo reset.");
    };

    return (
        <div className="gam-arcade" data-gam-arcade="">
            <div className="gam-arcade__player">
                <div className="gam-player">
                    <Avatar fallback="Y" size="lg" glow="xp" alt="You" />
                    <div className="gam-player__id">
                        <Heading as="h2" size="md" weight="bold" className="feature-display">
                            Your profile
                        </Heading>
                        <Text as="p" size="sm" color="muted">
                            Seeded player, playing live.
                        </Text>
                    </div>
                </div>

                <div className="gam-score" data-gam-score="">
                    <StatList
                        className="gam-stats"
                        align="left"
                        items={[
                            { key: "total-xp", value: you.total.toLocaleString("en-US"), label: "total XP" },
                            { key: "achievements", value: `${you.achievements.length} / ${seed.achievements.length}`, label: "achievements" },
                            { key: "rank", value: `#${rank}`, label: "on the leaderboard" },
                        ]}
                    />
                </div>

                <ul className="gam-meters">
                    {seed.metrics.map((metric) => {
                        const xp = you.xp[metric.slug];
                        const p = progressFor(xp);
                        const into = xp - p.floor;
                        const span = p.next ? p.next.xp - p.floor : 1;
                        const text = p.next
                            ? `${into} of ${span} XP to level ${p.next.level}, ${p.next.name}`
                            : `${xp} XP, top level reached`;
                        const labelId = `gam-meter-${metric.slug}`;
                        return (
                            <li key={metric.slug} className="gam-meter" data-gam-metric={metric.slug}>
                                <div className="gam-meter__head">
                                    <span id={labelId} className="gam-meter__name">
                                        <Icon name={metric.icon} size="sm" /> {metric.name}
                                    </span>
                                    <Badge color="amber" variant="soft">
                                        Lv {p.level} · {p.name}
                                    </Badge>
                                </div>
                                <Progress
                                    value={p.next ? into : 1}
                                    max={span}
                                    size="lg"
                                    color="amber"
                                    aria-labelledby={labelId}
                                    aria-valuetext={text}
                                    fillClassName="gam-meter__fill"
                                />
                                <Text as="p" size="sm" color="muted" className="gam-meter__caption">
                                    {text}
                                </Text>
                            </li>
                        );
                    })}
                </ul>

                <div className="gam-actions">
                    {seed.actions.map((action) => (
                        <Button key={action.id} icon={action.icon} color="amber" className="gam-tap" data-gam-action={action.id} onClick={() => act(action.id)}>
                            {action.label} (+{action.amount})
                        </Button>
                    ))}
                    <Button icon="rotate-ccw" variant="ghost" className="gam-tap" onClick={reset}>
                        Reset
                    </Button>
                </div>

                <p className="gam-sr" role="status" aria-live="polite">
                    {announcement}
                </p>

                <div className="gam-feed-wrap">
                    <Heading as="h3" size="sm" weight="semibold">
                        Event stream
                    </Heading>
                    <ol className="gam-feed" aria-label="Award events">
                        {feed.length === 0 ? (
                            <li className="gam-feed__empty">Each award fires an event, as XpAwarded and AchievementUnlocked do in the package.</li>
                        ) : (
                            feed.map((item) => (
                                <li key={item.id} data-kind={item.event.kind}>
                                    <Icon name={item.event.kind === "xp" ? "plus" : item.event.kind === "level" ? "chevrons-up" : "trophy"} size="sm" />
                                    <span>{describe(item.event)}</span>
                                </li>
                            ))
                        )}
                    </ol>
                </div>
            </div>

            <div className="gam-arcade__board">
                <Heading as="h2" size="md" weight="bold" className="feature-display">
                    Leaderboard
                </Heading>
                <div className="gam-toggle" role="group" aria-label="Rank by">
                    {(["xp", "achievements"] as const).map((value) => (
                        <Button
                            key={value}
                            color={sort === value ? "amber" : undefined}
                            className="gam-tap"
                            active={sort === value}
                            aria-pressed={sort === value}
                            onClick={() => setSort(value)}
                        >
                            {value === "xp" ? "By XP" : "By achievements"}
                        </Button>
                    ))}
                </div>
                <div className="gam-table">
                    <Table>
                        <Table.Head>
                            <Table.Column label="#" />
                            <Table.Column label="Player" />
                            <Table.Column label="XP" className="gam-right" />
                            <Table.Column label="Achievements" className="gam-right" />
                        </Table.Head>
                        <Table.Body>
                            {board.map((player) => (
                                <Table.Row key={player.id} data-gam-player={player.id} data-you={player.id === seed.you ? "" : undefined} className="gam-row">
                                    <Table.Cell className="gam-rank">{player.rank}</Table.Cell>
                                    <Table.Cell>
                                        <span className="gam-who">
                                            <Avatar fallback={player.name.slice(0, 1)} size="md" alt={player.name} />
                                            {player.name}
                                        </span>
                                    </Table.Cell>
                                    <Table.Cell className="gam-right gam-num">{player.total.toLocaleString("en-US")}</Table.Cell>
                                    <Table.Cell className="gam-right gam-num">{player.achievements.length}</Table.Cell>
                                </Table.Row>
                            ))}
                        </Table.Body>
                    </Table>
                </div>

                <Heading as="h3" size="sm" weight="semibold">
                    Your achievements
                </Heading>
                <ul className="gam-shelf">
                    {seed.achievements.map((achievement) => {
                        const unlocked = you.achievements.includes(achievement.slug);
                        return (
                            <li key={achievement.slug} className="gam-badge" data-gam-achievement={achievement.slug} data-unlocked={unlocked ? "" : undefined}>
                                <span className="gam-badge__icon" aria-hidden>
                                    <Icon name={unlocked ? achievement.icon : "lock"} size="sm" />
                                </span>
                                <span className="gam-badge__text">
                                    <span className="gam-badge__name">{achievement.name}</span>
                                    <span className="gam-badge__desc">
                                        {unlocked ? "Unlocked. " : "Locked. "}
                                        {achievement.description}
                                    </span>
                                </span>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </div>
    );
}
