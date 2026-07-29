#!/bin/bash
# Deploy Laravel backend to back.artigocomcafe.com

SERVER="arti3263@br64-da.valueserver.net.br"
PORT="1157"
REMOTE_PATH="/home/arti3263/domains/back.artigocomcafe.com/public_html"

echo "--- Creating deployment package ---"
rm -rf deploy_package vendor node_modules storage/framework/cache/data/*
mkdir -p deploy_package

# Copy essential files
rsync -av --exclude='vendor' \
          --exclude='node_modules' \
          --exclude='.env' \
          --exclude='deploy_package' \
          --exclude='deploy_backend.sh' \
          --exclude='tests' \
          --exclude='storage/logs/*' \
          --exclude='storage/framework/cache/data/*' \
          --exclude='storage/framework/sessions/*' \
          --exclude='storage/framework/views/*' \
          --exclude='.git' \
          ./ deploy_package/

echo "--- Creating .env for production ---"
cat > deploy_package/.env << 'ENVEOF'
APP_NAME="Artigo com Cafe API"
APP_ENV=production
APP_KEY=
APP_DEBUG=false
APP_URL=https://back.artigocomcafe.com

APP_LOCALE=pt_BR
APP_FALLBACK_LOCALE=en
APP_FAKER_LOCALE=pt_BR

LOG_CHANNEL=stack
LOG_LEVEL=warning

DB_CONNECTION=mysql
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=arti3263_artigocafe
DB_USERNAME=arti3263_artigocafe
DB_PASSWORD=CmQ#yD7R.u993t

SESSION_DRIVER=file
SESSION_LIFETIME=120

BROADCAST_CONNECTION=log
FILESYSTEM_DISK=local
QUEUE_CONNECTION=database

CACHE_STORE=redis
REDIS_CLIENT=phpredis
REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379

MAIL_MAILER=log
MAIL_FROM_ADDRESS="noreply@artigocomcafe.com"
MAIL_FROM_NAME="${APP_NAME}"

SANCTUM_STATEFUL_DOMAINS=artigocomcafe.com,back.artigocomcafe.com
ENVEOF

echo "--- Packaging ---"
cd deploy_package && tar czf ../backend-deploy.tar.gz . && cd ..
rm -rf deploy_package

echo "--- Uploading to server ---"
scp -P $PORT backend-deploy.tar.gz $SERVER:$REMOTE_PATH/

echo "--- Extracting and setting up on server ---"
ssh -p $PORT $SERVER << 'SSHEOF'
cd /home/arti3263/domains/back.artigocomcafe.com/public_html
mv public_html public_html_bk 2>/dev/null
mkdir -p public_html_new
mv backend-deploy.tar.gz public_html_new/
cd public_html_new
tar xzf backend-deploy.tar.gz
rm backend-deploy.tar.gz

# Set up storage
mkdir -p storage/framework/{cache,sessions,testing,views}
mkdir -p storage/logs
chmod -R 775 storage bootstrap/cache
chmod -R 775 public

# Install composer
php -d memory_limit=-1 /usr/local/bin/composer install --no-interaction --optimize-autoloader --no-dev

# Generate key
php artisan key:generate --force

# Run migrations
php artisan migrate --force

# Run seeders
php artisan db:seed --force

# Cache
php artisan config:cache
php artisan route:cache

# Fix permissions
chmod -R 775 storage bootstrap/cache

echo "--- Deployment complete ---"
echo "--- To activate, rename directory: ---"
echo "mv public_html public_html_old && mv public_html_new public_html"
SSHEOF

rm backend-deploy.tar.gz
echo "--- Script finished ---"
