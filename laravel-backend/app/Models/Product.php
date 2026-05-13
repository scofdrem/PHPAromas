<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'brand',
        'brand_id',
        'category',
        'category_id',
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
    ];

    /**
     * Get the brand that owns the product.
     */
    public function brandRelation()
    {
        return $this->belongsTo(Brand::class, 'brand_id');
    }

    /**
     * Get the category that owns the product.
     */
    public function categoryRelation()
    {
        return $this->belongsTo(Category::class, 'category_id');
    }
}