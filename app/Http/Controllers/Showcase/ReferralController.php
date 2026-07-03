<?php

namespace App\Http\Controllers\Showcase;

use App\Http\Controllers\Controller;
use App\Services\Mlm\MlmProgram;
use FancyMlm\Laravel\Models\Member;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The end-user "refer a friend" surface — the gamified downline view built on
 * fancy-mlm-ui (DownlineTree / CommissionStatement / RankProgress) over the live
 * fancy-mlm engine. The signed-in user is the root of the seeded demo network;
 * "simulate activity" runs the real fun-lab referral loop and shows the payout.
 */
class ReferralController extends Controller
{
    public function show(Request $request, MlmProgram $program): Response
    {
        $me = $program->memberForUser($request->user());

        return Inertia::render('Referrals/Show', [
            'program' => [
                'tree' => $program->plan()->tree,
                'edge' => $program->edge(),
                'metric' => $program->plan()->metric,
                'tiers' => array_keys($program->planData()['tiers'] ?? []),
            ],
            'myMemberId' => (string) $me->getKey(),
            'referralCode' => $this->referralCode($me),
            'network' => $program->network(),
            'commissions' => $program->commissionsForUser($request->user()),
            'rank' => $program->rankProgress($me),
        ]);
    }

    public function simulate(Request $request, MlmProgram $program): RedirectResponse
    {
        $data = $request->validate([
            'member_id' => ['required', 'string'],
            'amount' => ['nullable', 'numeric', 'min:1', 'max:100000'],
        ]);

        $member = Member::query()->find($data['member_id']);
        if ($member === null) {
            return back()->with('error', 'That member is not in the network.');
        }

        $rewards = $program->simulateActivity($member, (float) ($data['amount'] ?? 100));

        $label = $member->user?->name ?? ($member->meta['label'] ?? 'Member #'.$member->getKey());

        return back()
            ->with('mlm_rewards', $rewards)
            ->with('success', $rewards === []
                ? "{$label} acted, but no upline was eligible under this plan."
                : "{$label} acted — ".count($rewards).' upline member(s) earned a referral bonus.');
    }

    private function referralCode(Member $member): string
    {
        return strtoupper('FANCY-'.str_pad((string) $member->getKey(), 5, '0', STR_PAD_LEFT));
    }
}
