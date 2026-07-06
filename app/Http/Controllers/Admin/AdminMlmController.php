<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\Mlm\MlmProgram;
use FancyMlm\Laravel\Models\Member;
use FancyMlm\Plan\CompensationPlan;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Admin surface for the referral program. Two jobs:
 *
 * 1. PLAN config — pick the downline SHAPE (unilevel / binary / matrix), the
 *    matrix width, the per-level decay, and the tier multipliers. Saving writes
 *    the plan to a Setting; because the container binds fancy-mlm's
 *    CompensationPlan to that Setting (see AppServiceProvider), the change is
 *    live on the next request across the engine, facade, and the fun-lab
 *    referral listener.
 *
 * 2. MEMBER management — create a member for an existing user, re-point any
 *    member's sponsor/placement (with a server-side cycle guard), toggle
 *    tier/active, splice-delete, and purge demo-seeded rows. The live preview
 *    re-shapes with every change — no seeder required, ever.
 */
class AdminMlmController extends Controller
{
    public function index(Request $request, MlmProgram $program): Response
    {
        return Inertia::render('Admin/Mlm/Index', [
            'plan' => $program->planData(),
            'edge' => $program->edge(),
            'network' => $program->network(),
            'members' => $program->membersForAdmin(),
            'eligibleUsers' => $program->usersWithoutMember(),
            'tierKeys' => array_keys($program->planData()['tiers'] ?? []),
            'trees' => [
                ['value' => CompensationPlan::TREE_UNILEVEL, 'label' => 'Unilevel', 'blurb' => 'Unlimited frontline. Rewards climb the sponsor (enroller) tree — everyone you personally refer is a direct leg.'],
                ['value' => CompensationPlan::TREE_BINARY, 'label' => 'Binary', 'blurb' => 'Two legs per node. Rewards climb the placement tree; extra referrals spill over to fill the next open slot below.'],
                ['value' => CompensationPlan::TREE_MATRIX, 'label' => 'Matrix', 'blurb' => 'A forced W×depth grid. Rewards climb the placement tree; the frontline is capped at the configured width.'],
            ],
        ]);
    }

    public function update(Request $request, MlmProgram $program): RedirectResponse
    {
        $data = $request->validate([
            'tree' => ['required', 'in:unilevel,binary,matrix'],
            'width' => ['required', 'integer', 'min:2', 'max:6'],
            'levelFactors' => ['required', 'array', 'min:1', 'max:8'],
            'levelFactors.*' => ['numeric', 'min:0', 'max:1'],
            'compression' => ['required', 'boolean'],
            'tiers' => ['required', 'array', 'min:1'],
            'tiers.*' => ['numeric', 'min:0.1', 'max:10'],
        ]);

        $program->savePlan([
            'tree' => $data['tree'],
            'width' => (int) $data['width'],
            'levelFactors' => array_values(array_map('floatval', $data['levelFactors'])),
            'compression' => (bool) $data['compression'],
            'tiers' => array_map('floatval', $data['tiers']),
        ]);

        return back()->with('success', 'Compensation plan updated — the '.$data['tree'].' tree is now live.');
    }

    /**
     * Create a member row for an existing user who doesn't have one yet — the
     * admin counterpart of the automatic memberForUser() on /referrals.
     */
    public function storeMember(Request $request, MlmProgram $program): RedirectResponse
    {
        $table = (new Member)->getTable();

        $data = $request->validate([
            'user_id' => ['required', 'integer', Rule::exists('users', 'id'), Rule::unique($table, 'user_id')],
            'sponsor_id' => ['nullable', 'integer', Rule::exists($table, 'id')],
            'placement_id' => ['nullable', 'integer', Rule::exists($table, 'id')],
            'tier' => ['nullable', 'string', Rule::in(array_keys($program->planData()['tiers'] ?? []))],
        ]);

        $user = User::query()->findOrFail($data['user_id']);
        $program->createForUser(
            $user,
            isset($data['sponsor_id']) ? (int) $data['sponsor_id'] : null,
            isset($data['placement_id']) ? (int) $data['placement_id'] : null,
            $data['tier'] ?? null,
        );

        return back()->with('success', "{$user->name} joined the network.");
    }

    /** Re-organize a member: sponsor, placement, tier, active. */
    public function updateMember(Request $request, MlmProgram $program, Member $member): RedirectResponse
    {
        $table = $member->getTable();

        $data = $request->validate([
            'sponsor_id' => ['nullable', 'integer', Rule::exists($table, 'id')],
            'placement_id' => ['nullable', 'integer', Rule::exists($table, 'id')],
            'tier' => ['required', 'string', Rule::in(array_keys($program->planData()['tiers'] ?? []))],
            'active' => ['required', 'boolean'],
        ]);

        // Throws a sponsor_id / placement_id validation error on a cyclic assignment.
        $program->updateMember($member, $data);

        return back()->with('success', 'Member updated — the tree re-shaped.');
    }

    /** Splice-delete a member: their downline re-attaches to their own upline. */
    public function destroyMember(MlmProgram $program, Member $member): RedirectResponse
    {
        $program->deleteMember($member);

        return back()->with('success', 'Member removed — their downline was re-attached to their upline.');
    }

    /** Delete every demo-seeded member (splicing any real children back in). */
    public function purgeDemoMembers(MlmProgram $program): RedirectResponse
    {
        $removed = $program->purgeDemo();

        return back()->with('success', $removed > 0
            ? "Removed {$removed} demo member(s) — real members were re-attached where needed."
            : 'No demo members to remove.');
    }
}
