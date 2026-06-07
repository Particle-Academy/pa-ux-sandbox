<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdminSettingsController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Admin/Settings', [
            'trackerCode' => Setting::get('tracker_code', '') ?? '',
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'tracker_code' => ['nullable', 'string', 'max:20000'],
        ]);

        Setting::put('tracker_code', $data['tracker_code'] ?? '');

        return back()->with('success', 'Settings saved.');
    }
}
