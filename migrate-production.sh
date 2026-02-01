#!/bin/bash
echo ">>> Production Database Migration Helper"
echo "This script helps you apply database changes (migrations) to your production database (Neon/Render)."
echo ""
echo "Please enter your DIRECT_URL (starts with postgres://...):"
read -r DIRECT_URL

if [ -z "$DIRECT_URL" ]; then
  echo "Error: DIRECT_URL cannot be empty."
  exit 1
fi

echo ">>> Running migrations..."
DIRECT_URL="$DIRECT_URL" npx prisma migrate deploy

echo ">>> Migration complete."
