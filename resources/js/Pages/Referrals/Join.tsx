import { Head, usePage } from "@inertiajs/react";
import { Badge, Button, Card, Heading, Icon, Text } from "@particle-academy/react-fancy";
import { Layout } from "../Layout";
import { PlayerAvatar, PlayerName, type PlayerIdentityData } from "../../components/PlayerIdentity";

type Props = {
    inviter: {
        identity: PlayerIdentityData;
        username: string;
    };
};

/**
 * The /join/{username} referral landing — a real, shareable page (the server
 * renders personalized OG meta + a 1200×630 card for it) instead of the old
 * instant 302 that made every shared invite inherit the generic home preview.
 * The 30-day attribution cookie is set server-side on this page's request; the
 * sponsor attaches when the visitor signs in and their member row is created.
 */
export default function ReferralsJoin({ inviter }: Props) {
    const { auth } = usePage<{ auth: { user: { name: string } | null } }>().props;
    const signedIn = auth.user !== null;

    return (
        <Layout>
            <Head title={`${inviter.identity.name} invited you`} />

            <div className="mx-auto flex max-w-2xl flex-col gap-6 py-10 md:py-16">
                <Card className="overflow-hidden">
                    <div className="bg-gradient-to-br from-violet-500/10 via-transparent to-sky-500/10 p-8 text-center md:p-12">
                        <Badge color="violet" variant="soft" className="mb-6">
                            <Icon name="gift" className="mr-1 h-3.5 w-3.5" />
                            Referral invite
                        </Badge>

                        <div className="mb-5 flex justify-center">
                            <PlayerAvatar
                                player={inviter.identity}
                                size="xl"
                                className="h-20 w-20"
                                fallbackRingClassName="border-2 border-violet-500/40"
                            />
                        </div>

                        <Heading as="h1" className="!text-3xl">
                            <PlayerName player={inviter.identity} /> invited you to Fancy UI
                        </Heading>
                        <Text className="mx-auto mt-3 max-w-md text-[var(--fg-2)]">
                            Sign in and you'll join{" "}
                            <span className="font-medium text-[var(--fg-1)]">@{inviter.username}</span>'s referral
                            network — then build with components made for the surfaces where humans and AI agents
                            work together.
                        </Text>

                        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                            {signedIn ? (
                                <Button color="violet" href="/referrals" icon="users">
                                    See your referral network
                                </Button>
                            ) : (
                                <Button color="violet" href="/auth/github" icon="github">
                                    Sign in with GitHub
                                </Button>
                            )}
                            <Button variant="ghost" href="/" iconTrailing="arrow-right">
                                Explore Fancy UI
                            </Button>
                        </div>

                        <Text className="mt-6 text-xs text-[var(--fg-3)]">
                            Your invite is remembered for 30 days — sign in any time and you'll still land on{" "}
                            {inviter.identity.name}'s team.
                        </Text>
                    </div>
                </Card>
            </div>
        </Layout>
    );
}
