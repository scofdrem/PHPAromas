<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AppConfig extends Model
{
    protected $fillable = [
        'key',
        'value',
    ];

    protected $casts = [
        'value' => 'array',
    ];

    public function getValueAttribute(mixed $value): mixed
    {
        // Try to decode JSON if it's a string
        if (is_string($value) && $decoded = json_decode($value, true)) {
            return $decoded;
        }

        return $value;
    }

    public function setValueAttribute(mixed $value): void
    {
        // Encode arrays as JSON
        $this->attributes['value'] = is_array($value) ? json_encode($value) : $value;
    }
}