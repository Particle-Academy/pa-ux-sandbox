<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\Mlm\MlmProgram;
use FancyMlm\Plan\CompensationPlan;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Admin config surface for the referral program — pick the downline SHAPE
 * (unilevel / binary / matrix), the matrix width, the per-level decay, and the
 * tier multipliers. Saving writes the plan to a Setting; because the container
 * binds fancy-mlm's CompensationPlan to that Setting (see AppServiceProvider),
 * the change is live on the next request across the engine, facade, and the
 * fun-lab referral listener. The page previews the SAME seeded network reshaped
 * by whichever tree is selected — the showcase's versatility story.
 */
class AdminMlmController extends Controller
{
    public function index(Request $request, MlmProgram $program): Response
    {
        return Inertia::render('Admin/Mlm/Index', [
            'plan' => $program->planData(),
            'edge' => $program->edge(),
            'network' => $program->network(),
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
}
