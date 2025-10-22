#!/bin/bash

# Slate LMS Production Seeding Script
# This script helps you seed your production database

echo "🌱 Slate LMS Production Seeding Script"
echo "======================================"

# Get the base URL
if [ -z "$1" ]; then
    echo "Usage: ./seed-production.sh <your-app-url> [secret-key]"
    echo "Example: ./seed-production.sh https://your-app.vercel.app"
    echo "Example: ./seed-production.sh https://your-app.vercel.app my-secret-key"
    exit 1
fi

BASE_URL="$1"
SECRET_KEY="${2:-slate-seed-2024}"

echo "🚀 Seeding database at: $BASE_URL"
echo "🔑 Using secret key: $SECRET_KEY"
echo ""

# Check if the app is running
echo "📡 Checking if app is running..."
if curl -s "$BASE_URL/api/health" > /dev/null; then
    echo "✅ App is running"
else
    echo "❌ App is not responding. Please check your URL and make sure the app is deployed."
    exit 1
fi

# Check seeding status
echo ""
echo "📊 Checking current seeding status..."
STATUS_RESPONSE=$(curl -s "$BASE_URL/api/seed/seed-status")
echo "$STATUS_RESPONSE" | jq '.' 2>/dev/null || echo "$STATUS_RESPONSE"

# Ask for confirmation
echo ""
read -p "🤔 Do you want to proceed with seeding? This will clear existing data. (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Seeding cancelled"
    exit 1
fi

# Perform seeding
echo ""
echo "🌱 Starting seeding process..."
SEED_RESPONSE=$(curl -s -X POST "$BASE_URL/api/seed/seed-production" \
    -H "Content-Type: application/json" \
    -d "{\"secret\": \"$SECRET_KEY\"}")

echo "$SEED_RESPONSE" | jq '.' 2>/dev/null || echo "$SEED_RESPONSE"

# Check if successful
if echo "$SEED_RESPONSE" | grep -q '"success":true'; then
    echo ""
    echo "🎉 Seeding completed successfully!"
    echo ""
    echo "📝 Login Credentials:"
    echo "   Admin: admin@slate.com / Admin@123456"
    echo "   Instructor: john.doe@example.com / Instructor123!"
    echo "   Student: alice.johnson@example.com / Student123!"
    echo ""
    echo "🌐 You can now login to your app with these credentials!"
else
    echo ""
    echo "❌ Seeding failed. Please check the error message above."
    exit 1
fi
