#!/bin/bash
set -e

echo ">>> Starting Build for Manual Deploy..."

# 1. Backup old build
if [ -d "build" ]; then
  echo ">>> Backing up old build..."
  rm -rf build_backup
  mv build build_backup
fi

# 2. Install dependencies for bundling
echo ">>> Installing build tools..."
npm install esbuild --save-dev --legacy-peer-deps

# 3. Generate Prisma Client (with new binary targets)
echo ">>> Generating Prisma Client..."
npx prisma generate

# 4. Build Frontend
echo ">>> Building Frontend..."
npm run build

# 5. Prepare Deploy Directory
echo ">>> preparing 'deploy_package' folder..."
rm -rf deploy_package
mkdir -p deploy_package/netlify/functions
mkdir -p deploy_package/build

# Copy Frontend Build
cp -R build/* deploy_package/build/

# Copy Netlify Config
cp netlify.toml deploy_package/

# 6. Bundle Backend Function
echo ">>> Bundling Functions..."
# We use esbuild to bundle everything into a single file, 
# BUT we mark 'prisma' and '@prisma/client' as external because they need binary files.
# We also mark 'pg' external usually, but let's try bundling it.
# Actually, for a Drop, we need node_modules for the native parts.

./node_modules/.bin/esbuild netlify/functions/api.js \
  --bundle \
  --platform=node \
  --target=node18 \
  --external:@prisma/client \
  --external:prisma \
  --external:pg \
  --outfile=deploy_package/netlify/functions/api.js

# 7. Handle Dependencies for Drop
# Since we have external dependencies, we need to copy node_modules or package.json
# For a "Drag and Drop" to work with functions, Netlify usually expects a pre-built folder 
# BUT it won't install dependencies for us unless we deploy via Git/CLI.
# SO, we must provide the node_modules in the function folder or root.

echo ">>> Copying dependencies..."
cp package.json deploy_package/
cp -R node_modules deploy_package/

# Copy Prisma Schema and Migrations (if needed, mostly schema)
mkdir -p deploy_package/prisma
cp prisma/schema.prisma deploy_package/prisma/

echo ">>> Build Complete!"
echo ">>> You can now drag and drop the 'deploy_package' folder to Netlify."
echo ">>> OR (Recommended) Run: npx netlify deploy --prod --dir=deploy_package/build"
