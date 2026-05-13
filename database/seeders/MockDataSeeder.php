<?php

namespace Database\Seeders;

use App\Models\Brand;
use App\Models\Category;
use App\Models\Product;
use App\Models\SiteContent;
use App\Models\AppConfig;
use Illuminate\Database\Seeder;

class MockDataSeeder extends Seeder
{
    public function run(): void
    {
        // Create brands (perfume houses)
        $brands = [
            ['name' => 'Chanel', 'slug' => 'chanel'],
            ['name' => 'Dior', 'slug' => 'dior'],
            ['name' => 'Gucci', 'slug' => 'gucci'],
            ['name' => 'Tom Ford', 'slug' => 'tom-ford'],
            ['name' => 'Yves Saint Laurent', 'slug' => 'yves-saint-laurent'],
            ['name' => 'Versace', 'slug' => 'versace'],
            ['name' => 'Prada', 'slug' => 'prada'],
            ['name' => 'Hermès', 'slug' => 'hermes'],
            ['name' => 'Jo Malone', 'slug' => 'jo-malone'],
            ['name' => 'Byredo', 'slug' => 'byredo'],
        ];

        foreach ($brands as $brandData) {
            Brand::create($brandData);
        }

        // Create categories
        $categories = [
            ['name' => 'Парфюмерия', 'slug' => 'perfume', 'image' => 'https://example.com/cat-perfume.jpg'],
            ['name' => 'Макияж', 'slug' => 'makeup', 'image' => 'https://example.com/cat-makeup.jpg'],
            ['name' => 'Уход за кожей', 'slug' => 'skincare', 'image' => 'https://example.com/cat-skincare.jpg'],
            ['name' => 'Уход за волосами', 'slug' => 'haircare', 'image' => 'https://example.com/cat-hair.jpg'],
        ];

        foreach ($categories as $catData) {
            Category::create($catData);
        }

        // Create products
        $products = [
            [
                'brand_id' => 1, // Chanel
                'brand' => 'Chanel',
                'name' => 'Chanel No. 5',
                'category' => 'perfume',
                'gender' => 'female',
                'age_range' => '25-65',
                'volumes' => '35ml, 50ml, 100ml',
                'description' => 'Легендарный цветочно-альдегидный аромат, созданный в 1921 году.',
                'image' => 'https://example.com/chanel-no5.jpg',
                'instagram_url' => 'https://instagram.com/chanel',
                'is_new' => false,
                'is_featured' => true,
            ],
            [
                'brand_id' => 1,
                'brand' => 'Chanel',
                'name' => 'Coco Mademoiselle',
                'category' => 'perfume',
                'gender' => 'female',
                'age_range' => '20-45',
                'volumes' => '35ml, 50ml, 100ml, 200ml',
                'description' => 'Современный восточный аромат для дерзкой и независимой женщины.',
                'image' => 'https://example.com/coco-mademoiselle.jpg',
                'instagram_url' => 'https://instagram.com/chanel',
                'is_new' => false,
                'is_featured' => true,
            ],
            [
                'brand_id' => 2, // Dior
                'brand' => 'Dior',
                'name' => 'Miss Dior',
                'category' => 'perfume',
                'gender' => 'female',
                'age_range' => '18-45',
                'volumes' => '30ml, 50ml, 100ml',
                'description' => 'Свежий цветочный аромат с нотами розы и бергамота.',
                'image' => 'https://example.com/miss-dior.jpg',
                'instagram_url' => 'https://instagram.com/dior',
                'is_new' => true,
                'is_featured' => true,
            ],
            [
                'brand_id' => 2,
                'brand' => 'Dior',
                'name' => 'Sauvage',
                'category' => 'perfume',
                'gender' => 'male',
                'age_range' => '20-55',
                'volumes' => '60ml, 100ml, 200ml',
                'description' => 'Свежий пряный древесный аромат для мужчин.',
                'image' => 'https://example.com/sauvage.jpg',
                'instagram_url' => 'https://instagram.com/dior',
                'is_new' => false,
                'is_featured' => true,
            ],
            [
                'brand_id' => 3, // Gucci
                'brand' => 'Gucci',
                'name' => 'Gucci Bloom',
                'category' => 'perfume',
                'gender' => 'female',
                'age_range' => '20-50',
                'volumes' => '30ml, 50ml, 100ml',
                'description' => 'Насыщенный белый цветочный аромат.',
                'image' => 'https://example.com/gucci-bloom.jpg',
                'instagram_url' => 'https://instagram.com/gucci',
                'is_new' => true,
                'is_featured' => false,
            ],
            [
                'brand_id' => 4, // Tom Ford
                'brand' => 'Tom Ford',
                'name' => 'Black Orchid',
                'category' => 'perfume',
                'gender' => 'unisex',
                'age_range' => '25-60',
                'volumes' => '30ml, 50ml, 100ml',
                'description' => 'Роскошный восточный цветочный аромат с нотой черной орхидеи.',
                'image' => 'https://example.com/black-orchid.jpg',
                'instagram_url' => 'https://instagram.com/tomford',
                'is_new' => false,
                'is_featured' => true,
            ],
        ];

        foreach ($products as $productData) {
            Product::create($productData);
        }

        // Create site content (using setValue helper which JSON-encodes automatically)
        SiteContent::setValue('hero_title', ['ru' => '1000 Ароматов', 'en' => '1000 Aromas']);
        SiteContent::setValue('hero_subtitle', ['ru' => 'Найдите свой идеальный аромат', 'en' => 'Find your perfect fragrance']);
        SiteContent::setValue('about_text', ['ru' => 'Мы предлагаем лучшую парфюмерию со всего мира.', 'en' => 'We offer the finest fragrances from around the world.']);
        SiteContent::setValue('contact_phone', ['value' => '+375 29 123 45 67']);
        SiteContent::setValue('contact_email', ['value' => 'info@1000aroms.by']);
        SiteContent::setValue('address', ['ru' => 'г. Минск, пр. Независимости, 1', 'en' => 'Minsk, Independence Ave, 1']);

        // Create app configs
        AppConfig::create(['key' => 'site_name', 'value' => '1000 Aromas']);
        AppConfig::create(['key' => 'site_description', 'value' => 'Premium fragrance boutique']);
        AppConfig::create(['key' => 'currency', 'value' => 'BYN']);
        AppConfig::create(['key' => 'language', 'value' => 'ru']);
        AppConfig::create(['key' => 'maintenance_mode', 'value' => 'false']);

        $this->command->info('Mock data seeded successfully!');
    }
}