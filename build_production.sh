#!/bin/bash
# Production Build Script
# Builds frontend assets and prepares for production deployment

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$SCRIPT_DIR/frontend"

echo "=== PHPAromas Production Build ==="
echo ""

# Check dependencies
command -v composer >/dev/null 2>&1 || { echo "Composer required"; exit 1; }
command -v node >/dev/null 2>&1 || { echo "Node.js required"; exit 1; }

# Backend build
echo "[1/3] Building backend..."
cd "$SCRIPT_DIR"
if [ -f "composer.json" ]; then
    composer install --no-dev --optimize-autoloader --no-scripts --no-autoloader
    composer dump-autoload --optimize
fi

# Frontend build
echo "[2/3] Building frontend..."
cd "$FRONTEND_DIR"

# Detect package manager
if [ -f "pnpm-lock.yaml" ]; then
    PM="pnpm"
elif [ -f "package-lock.json" ]; then
    PM="npm"
else
    PM="npm"
fi

echo "Using package manager: $PM"

# Install dependencies
if [ -f "$PM.lock.yaml" ] || [ -f "package-lock.json" ]; then
    $PM ci
else
    $PM install
fi

# Build frontend
$PM run build

# Post-build optimizations
echo "[3/3] Optimizing..."
cd "$SCRIPT_DIR"

# Create optimized storage links
php artisan storage:link 2>/dev/null || true

# Cache routes and views for production
php artisan route:cache 2>/dev/null || true
php artisan view:cache 2>/dev/null || true

# Clear any cached config
php artisan config:clear 2>/dev/null || true

echo ""
echo "=== Build Complete ==="
echo "Frontend assets: public/build/"
echo "Run 'php artisan serve' to start production server"