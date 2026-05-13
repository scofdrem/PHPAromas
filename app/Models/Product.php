<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'brand_id',
        'category',
        'gender',
        'age_range',
        'volumes',
        'image',
        'description',
        'instagram_url',
        'is_new',
        'is_featured',
    ];

    protected $casts = [
        'is_new' => 'boolean',
        'is_featured' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the brand that owns the product.
     */
    public function brand(): BelongsTo
    {
        return $this->belongsTo(Brand::class);
    }

    /**
     * Scope for featured products.
     */
    public function scopeFeatured($query)
    {
        return $query->where('is_featured', true);
    }

    /**
     * Scope for new products.
     */
    public function scopeNew($query)
    {
        return $query->where('is_new', true);
    }

    /**
     * Scope for filtering by gender.
     */
    public function scopeForGender($query, string $gender)
    {
        return $query->where('gender', $gender);
    }

    /**
     * Scope for filtering by category.
     */
    public function scopeInCategory($query, string $category)
    {
        return $query->where('category', $category);
    }
}