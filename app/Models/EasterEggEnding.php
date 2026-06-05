<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * One discovered ending of a hidden Easter-egg story, per user.
 */
class EasterEggEnding extends Model
{
    protected $fillable = ['user_id', 'egg', 'ending'];
}
