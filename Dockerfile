# PHPAromas Production Dockerfile
# Multi-stage build for optimized image size

# ============================================
# Stage 1: Backend Dependencies
# ============================================
FROM php:8.4-fpm-alpine AS backend-deps

# Install system dependencies
RUN apk add --no-cache \
    linux-headers \
    $PHPIZE_DEPS \
    git \
    curl \
    zip \
    unzip \
    && docker-php-ext-install pdo pdo_mysql

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Copy only dependency files first for caching
COPY composer.json composer.lock ./

# Install dependencies (optimized for production)
RUN composer install \
    --no-dev \
    --optimize-autoloader \
    --no-scripts \
    --no-autoloader

# ============================================
# Stage 2: Frontend Build
# ============================================
FROM node:20-alpine AS frontend-deps

WORKDIR /app

# Copy dependency files
COPY frontend/package.json frontend/pnpm-lock.yaml* ./

# Install dependencies (pnpm preferred, npm fallback)
RUN if [ -f pnpm-lock.yaml ]; then \
        corepack enable pnpm && pnpm install --frozen-lockfile; \
    else \
        npm ci --only=production; \
    fi

# Copy frontend source
COPY frontend/ ./

# Build frontend for production
RUN if [ -f pnpm-lock.yaml ]; then \
        pnpm build; \
    else \
        npm run build; \
    fi

# ============================================
# Stage 3: Production Application
# ============================================
FROM php:8.4-fpm-alpine AS production

# Install system dependencies
RUN apk add --no-cache \
    linux-headers \
    $PHPIZE_DEPS \
    nodejs \
    npm \
    git \
    curl \
    zip \
    unzip \
    && docker-php-ext-install pdo pdo_mysql opcache

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Copy backend code
COPY --chown=www-data:www-data . .

# Copy vendor from deps stage
COPY --from=backend-deps /var/www/html/vendor ./vendor

# Copy built frontend assets
COPY --from=frontend-deps /app/dist ./public/build

# Set permissions
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache \
    && chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

# PHP Production optimizations
RUN echo "memory_limit=256M" >> /usr/local/etc/php/conf.d/production.ini \
    && echo "opcache.enable=1" >> /usr/local/etc/php/conf.d/production.ini \
    && echo "opcache.memory_consumption=128" >> /usr/local/etc/php/conf.d/production.ini \
    && echo "opcache.interned_strings_buffer=8" >> /usr/local/etc/php/conf.d/production.ini \
    && echo "opcache.max_accelerated_files=10000" >> /usr/local/etc/php/conf.d/production.ini \
    && echo "opcache.revalidate_freq=2" >> /usr/local/etc/php/conf.d/production.ini \
    && echo "opcache.fast_shutdown=1" >> /usr/local/etc/php/conf.d/production.ini

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Start PHP-FPM with production settings
CMD ["php-fpm"]