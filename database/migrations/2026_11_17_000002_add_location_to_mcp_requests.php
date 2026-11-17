<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Coarse visitor location on each MCP request, for the live map at
 * /admin/mcp/live. Read from Cloudflare's visitor-location request headers at
 * record time; no IP is stored and no GeoIP database is consulted.
 *
 * Latitude and longitude are rounded to one decimal (about 10 km). A row
 * with only a country has NULL coordinates and is placed at the country's
 * centroid when it is read, so the stored data never claims a precision
 * it did not have.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('mcp_requests', function (Blueprint $table) {
            $table->char('country', 2)->nullable()->after('ip_hash');
            $table->string('city', 100)->nullable()->after('country');
            $table->decimal('latitude', 4, 1)->nullable()->after('city');
            $table->decimal('longitude', 4, 1)->nullable()->after('latitude');

            $table->index(['country', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::table('mcp_requests', function (Blueprint $table) {
            $table->dropIndex(['country', 'created_at']);
            $table->dropColumn(['country', 'city', 'latitude', 'longitude']);
        });
    }
};
