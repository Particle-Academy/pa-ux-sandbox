<?php

namespace App\Models;

use Database\Factories\McpDailyArgValueFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Per day, tool and top-level scalar argument: how often each (normalised)
 * value was passed, and how often it came back empty or as an error. Feeds a
 * tool's "top values" and the search-demand report.
 */
class McpDailyArgValue extends Model
{
    /** @use HasFactory<McpDailyArgValueFactory> */
    use HasFactory;

    public $timestamps = false;

    protected $fillable = ['day', 'target', 'arg_key', 'arg_value', 'calls', 'empty_results', 'errors'];

    protected function casts(): array
    {
        return [
            'calls' => 'integer',
            'empty_results' => 'integer',
            'errors' => 'integer',
        ];
    }
}
