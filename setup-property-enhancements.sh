#!/bin/bash

# =====================================================
# Property Page Enhancements - Quick Setup Script
# =====================================================
# This script guides you through setting up the
# enhanced property information features
# =====================================================

echo "🏡 Property Page Enhancements Setup"
echo "===================================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Not in project root directory"
    echo "Please run this script from your project root"
    exit 1
fi

echo "✅ Project directory verified"
echo ""

# Step 1: Database Migration
echo "📝 STEP 1: Database Migration"
echo "------------------------------"
echo ""
echo "Please complete the following steps:"
echo ""
echo "1. Open Supabase Dashboard (https://app.supabase.com)"
echo "2. Select your project"
echo "3. Go to SQL Editor"
echo "4. Open file: supabase/add-property-details.sql"
echo "5. Copy and execute the SQL"
echo ""
read -p "Press ENTER when database migration is complete..."
echo ""

# Step 2: Seed Data (Optional)
echo "📝 STEP 2: Add Test Data (Optional)"
echo "------------------------------------"
echo ""
echo "Would you like to add sample property data?"
read -p "Add test data? (y/n): " add_test_data
echo ""

if [ "$add_test_data" = "y" ] || [ "$add_test_data" = "Y" ]; then
    echo "Please complete the following steps:"
    echo ""
    echo "1. Go to Supabase SQL Editor"
    echo "2. Open file: supabase/seed-enhanced-properties.sql"
    echo "3. Copy and execute the SQL"
    echo ""
    read -p "Press ENTER when test data is added..."
    echo "✅ Test data added"
else
    echo "⏭️  Skipping test data"
fi
echo ""

# Step 3: Install Dependencies (if needed)
echo "📦 STEP 3: Check Dependencies"
echo "------------------------------"
echo ""
echo "Checking if all dependencies are installed..."

if command -v npm &> /dev/null; then
    echo "✅ npm found"
    echo "Installing/updating dependencies..."
    npm install
    echo "✅ Dependencies installed"
else
    echo "❌ npm not found. Please install Node.js"
    exit 1
fi
echo ""

# Step 4: Verify Files
echo "🔍 STEP 4: Verify Files"
echo "------------------------"
echo ""

files=(
    "app/dashboard/property/[id]/page.tsx"
    "types/database.ts"
    "supabase/add-property-details.sql"
    "supabase/seed-enhanced-properties.sql"
    "PROPERTY_INFO_ENHANCEMENTS.md"
    "PROPERTY_ENHANCEMENTS_RU.md"
    "PROPERTY_VISUAL_GUIDE.md"
)

all_files_exist=true
for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ $file (missing)"
        all_files_exist=false
    fi
done
echo ""

if [ "$all_files_exist" = false ]; then
    echo "⚠️  Warning: Some files are missing"
    echo "This might indicate incomplete setup"
    read -p "Continue anyway? (y/n): " continue_anyway
    if [ "$continue_anyway" != "y" ] && [ "$continue_anyway" != "Y" ]; then
        echo "Setup cancelled"
        exit 1
    fi
fi

# Step 5: Start Development Server
echo "🚀 STEP 5: Start Development Server"
echo "------------------------------------"
echo ""
read -p "Start development server now? (y/n): " start_server

if [ "$start_server" = "y" ] || [ "$start_server" = "Y" ]; then
    echo ""
    echo "Starting development server..."
    echo "Access your app at: http://localhost:3000"
    echo ""
    echo "Navigate to any property detail page to see the enhancements!"
    echo ""
    npm run dev
else
    echo ""
    echo "✅ Setup Complete!"
    echo ""
    echo "To start the server later, run:"
    echo "  npm run dev"
    echo ""
fi

# Final Summary
echo ""
echo "================================================"
echo "✅ Property Page Enhancements Setup Complete!"
echo "================================================"
echo ""
echo "📚 Documentation:"
echo "  - Full Guide:        PROPERTY_INFO_ENHANCEMENTS.md"
echo "  - Quick Start (RU):  PROPERTY_ENHANCEMENTS_RU.md"
echo "  - Visual Guide:      PROPERTY_VISUAL_GUIDE.md"
echo "  - Changelog:         PROPERTY_ENHANCEMENTS_CHANGELOG.md"
echo ""
echo "🎯 What's New:"
echo "  ✓ 6 gradient feature cards"
echo "  ✓ Structured property details table"
echo "  ✓ Additional features section"
echo "  ✓ Property rules display"
echo "  ✓ Location & neighborhood scores"
echo "  ✓ 25+ new database fields"
echo ""
echo "🔗 Quick Links:"
echo "  - Property Page: /dashboard/property/[id]"
echo "  - Documentation: Check the MD files above"
echo ""
echo "🎉 Enjoy your enhanced property pages!"
echo ""
