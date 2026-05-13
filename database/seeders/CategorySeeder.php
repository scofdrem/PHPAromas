<?php

declare(strict_types=1);

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            ['name' => 'Отливанты', 'slug' => 'decants', 'image' => 'https://mgx-backend-cdn.metadl.com/generate/images/1170518/2026-05-03/nz24hyqaaflq/hero-banner-luxury-perfume.png'],
            ['name' => 'Женская', 'slug' => 'women', 'image' => 'https://mgx-backend-cdn.metadl.com/generate/images/1170518/2026-05-03/nz24fpiaafnq/product-featured-perfume-2.png'],
            ['name' => 'Мужская', 'slug' => 'men', 'image' => 'https://mgx-backend-cdn.metadl.com/generate/images/1170518/2026-05-03/nz24efyaafma/product-featured-perfume-3.png'],
            ['name' => 'Нишевая', 'slug' => 'niche', 'image' => 'https://mgx-backend-cdn.metadl.com/generate/images/1170518/2026-05-03/nz24hyqaaflq/hero-banner-luxury-perfume.png'],
            ['name' => 'Люксовая', 'slug' => 'luxury', 'image' => 'https://mgx-backend-cdn.metadl.com/generate/images/1170518/2026-05-03/nz24fpiaafnq/product-featured-perfume-2.png'],
            ['name' => 'Унисекс', 'slug' => 'unisex', 'image' => 'https://mgx-backend-cdn.metadl.com/generate/images/1170518/2026-05-03/nz24efyaafma/product-featured-perfume-3.png'],
        ];

        foreach ($categories as $category) {
            DB::table('categories')->updateOrInsert(
                ['slug' => $category['slug']],
                $category
            );
        }
    }
}