<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('token_id', 100)->unique(); // jti from JWT
            $table->string('ip_address', 45)->nullable();
            $table->string('user_agent')->nullable();
            $table->timestamp('last_active_at')->nullable();
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('revoked_at')->nullable();
            $table->string('fingerprint', 64)->nullable(); // device fingerprint hash

            $table->index(['user_id', 'revoked_at']);
            $table->index(['token_id', 'revoked_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_sessions');
    }
};