<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('brand'); // Brand name string (frontend compatible)
            $table->foreignId('brand_id')->nullable()->constrained('brands')->nullOnDelete();
            $table->string('category')->nullable(); // Category name string
            $table->foreignId('category_id')->nullable()->constrained('categories')->nullOnDelete();
            $table->string('gender')->nullable()->default('unisex');
            $table->string('age_range')->nullable()->default('25-35');
            $table->string('volumes')->nullable(); // Comma-separated volumes
            $table->string('image')->nullable();
            $table->text('description')->nullable();
            $table->string('instagram_url')->nullable();
            $table->boolean('is_new')->nullable()->default(false);
            $table->boolean('is_featured')->nullable()->default(false);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};