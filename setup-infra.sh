#!/usr/bin/env bash
set -euo pipefail

echo "🚀 Bootstrapping GrowLocal macOS Infrastructure..."

# 1. Verify Homebrew is installed
if ! command -v brew >/dev/null 2>&1; then
  echo "❌ Homebrew is not installed. Install it first from https://brew.sh"
  exit 1
fi

# 2. Install Node.js (includes npm) if missing
if ! command -v node >/dev/null 2>&1; then
  echo "📦 Installing Node.js via Homebrew..."
  brew install node
else
  echo "✅ Node.js already installed ($(node -v), npm $(npm -v))"
fi

# 3. Install & start PostgreSQL 16 if missing
if ! command -v psql >/dev/null 2>&1; then
  echo "🐘 Installing PostgreSQL 16 via Homebrew..."
  brew install postgresql@16
  brew link --force postgresql@16
else
  echo "✅ PostgreSQL client already installed ($(psql --version))"
fi

echo "🔄 Ensuring PostgreSQL service is running..."
brew services start postgresql@16 >/dev/null 2>&1 || brew services start postgresql >/dev/null 2>&1 || true
sleep 2

# 4. Create the 'growlocal' database if it doesn't exist
DB_NAME="growlocal"
if ! psql -lqt | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
  echo "🗄️  Creating PostgreSQL database '$DB_NAME'..."
  createdb "$DB_NAME"
else
  echo "✅ Database '$DB_NAME' already exists."
fi

# 5. Configure .env using current macOS user (Homebrew Postgres default superuser)
MAC_USER="$(whoami)"
if [ ! -f .env ]; then
  echo "⚙️  Creating .env configured for local Homebrew Postgres user '$MAC_USER'..."
  cat << EOF > .env
DATABASE_URL=postgres://${MAC_USER}@localhost:5432/${DB_NAME}
JWT_SECRET=growlocal-local-dev-secret-$(openssl rand -hex 12)
PORT=4000
EOF
else
  echo "✅ .env already exists (skipping overwrite)."
fi

# 6. Install npm workspace packages & Playwright Chromium
echo "📥 Installing npm workspace dependencies..."
npm install

echo "🎭 Installing Playwright Chromium browser..."
npx playwright install chromium

# 7. Push Drizzle schema & seed demo records
echo "📐 Pushing Drizzle schema to PostgreSQL..."
npm run db:push

echo "🌱 Seeding demo Owner & Client accounts..."
npm run db:seed

echo ""
echo "🎉 Infrastructure ready! Start the app with: npm run dev"
echo "   • Frontend: http://localhost:5173"
echo "   • Backend:  http://localhost:4000/api/health"
echo "   • Unit Tests: npm test"
echo "   • E2E Tests:  npm run test:e2e"