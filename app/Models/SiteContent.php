<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SiteContent extends Model
{
    use HasFactory;

    protected $fillable = [
        'content_key',
        'content_value',
    ];

    /**
     * Get a content value by key.
     */
    public static function getValue(string $key, mixed $default = null): mixed
    {
        $content = self::where('content_key', $key)->first();

        if (! $content) {
            return $default;
        }

        return json_decode($content->content_value, true) ?? $content->content_value;
    }

    /**
     * Set a content value by key.
     */
    public static function setValue(string $key, mixed $value): static
    {
        $contentValue = is_array($value) || is_object($value)
            ? json_encode($value)
            : $value;

        return self::updateOrCreate(
            ['content_key' => $key],
            ['content_value' => $contentValue]
        );
    }
}