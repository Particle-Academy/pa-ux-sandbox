<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;

/**
 * A server-captured screenshot of one page (site_key + path), stored on the
 * public disk and used as the focus-heatmap background. Upserted by
 * App\Services\Heuristics\PageScreenshotService on each verification poll.
 *
 * @property int $id
 * @property string $site_key
 * @property string $path
 * @property string $image_path
 * @property int $vw
 * @property int $vh
 * @property Carbon|null $captured_at
 */
class SitePageShot extends Model
{
    protected $fillable = [
        'site_key',
        'path',
        'image_path',
        'vw',
        'vh',
        'captured_at',
    ];

    protected $casts = [
        'vw' => 'integer',
        'vh' => 'integer',
        'captured_at' => 'datetime',
    ];

    /**
     * Public URL of the stored screenshot.
     */
    public function url(): string
    {
        return Storage::disk('public')->url($this->image_path);
    }
}
