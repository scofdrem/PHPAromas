<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Inquiry extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'email',
        'phone',
        'message',
        'product_name',
        'product_brand',
        'reply',
        'replied_at',
        'replied_by',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'replied_at' => 'datetime',
    ];

    /**
     * Get the user who replied to the inquiry.
     */
    public function replier()
    {
        return $this->belongsTo(User::class, 'replied_by');
    }

    /**
     * Scope for unanswered inquiries.
     */
    public function scopeUnanswered($query)
    {
        return $query->whereNull('replied_at');
    }

    /**
     * Scope for answered inquiries.
     */
    public function scopeAnswered($query)
    {
        return $query->whereNotNull('replied_at');
    }
}