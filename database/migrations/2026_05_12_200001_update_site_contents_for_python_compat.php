<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Adds key/value columns matching Python SDK pattern.
     */
    public function up(): void
    {
        Schema::table('site_contents', function (Blueprint $table) {
            // Add text value column for non-JSON content
            $table->text('value_text')->nullable()->after('content_value');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('site_contents', function (Blueprint $table) {
            $table->dropColumn('value_text');
        });
    }
};