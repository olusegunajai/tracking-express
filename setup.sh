#!/bin/bash

# Tokyo Express CMS - Local Setup Script

echo "🚀 Starting Tokyo Express CMS setup..."

# 1. Check for Node.js
if ! command -v node &> /dev/null
then
    echo "❌ Error: Node.js is not installed. Please install it from https://nodejs.org/"
    exit 1
fi

# 2. Install dependencies
echo "📦 Installing dependencies..."
npm install

# 3. Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from .env.example..."
    cp .env.example .env
    echo "✅ .env file created. Please update it with your secrets."
else
    echo "ℹ️ .env file already exists. Skipping creation."
fi

# 4. Success message
echo "✨ Setup complete!"
echo "👉 To start the application, run: npm run dev"
echo "👉 To build for production, run: npm run build"
echo "👉 Admin credentials (default): admin / admin123"
