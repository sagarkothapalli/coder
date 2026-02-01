#!/bin/bash
set -e

OUTPUT_DIR="finalp2"

echo ">>> Starting Final Build into '$OUTPUT_DIR'..."

# 1. Install dependencies (ensure esbuild is there)
echo ">>> Checking build tools..."
npm install esbuild --save-dev --legacy-peer-deps

# 2. Generate Prisma Client
echo ">>> Generating Prisma Client..."
npx prisma generate

# 3. Build Frontend
echo ">>> Building Frontend..."
npm run build

# 4. Prepare Output Directory
echo ">>> Preparing '$OUTPUT_DIR' folder..."
rm -rf "$OUTPUT_DIR"
mkdir -p "$OUTPUT_DIR"/netlify/functions
mkdir -p "$OUTPUT_DIR"/build

# Copy Frontend Build
cp -R build/* "$OUTPUT_DIR"/build/

# Copy Netlify Config
cp netlify.toml "$OUTPUT_DIR"/

# 5. Bundle Backend Function
echo ">>> Bundling Functions..."
./node_modules/.bin/esbuild netlify/functions/api.js \
  --bundle \
  --platform=node \
  --target=node18 \
  --external:@prisma/client \
  --external:prisma \
  --external:pg \
  --outfile="$OUTPUT_DIR"/netlify/functions/api.js

# 6. Copy Dependencies (Crucial for Prisma Binary)
echo ">>> Copying dependencies (this may take a moment)..."
cp package.json "$OUTPUT_DIR"/
cp -R node_modules "$OUTPUT_DIR"/
mkdir -p "$OUTPUT_DIR"/prisma
cp prisma/schema.prisma "$OUTPUT_DIR"/prisma/

echo ">>> Build Complete!"
echo ">>> The folder '$OUTPUT_DIR' is ready for Netlify."
