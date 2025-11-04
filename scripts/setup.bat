@echo off
REM Webhoxy Setup Script for Windows
REM This script sets up the development environment

echo 🚀 Setting up Webhoxy...
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ⚠️  Node.js is not installed. Please install Node.js 20+ first.
    exit /b 1
)

echo 📦 Node.js version:
node --version
echo.

REM Setup API
echo 🔧 Setting up API...
cd api

if not exist .env (
    echo Creating .env file from env.example...
    copy env.example .env
    echo ✓ Created api\.env
) else (
    echo ⚠️  api\.env already exists, skipping...
)

echo Installing API dependencies...
call npm install
echo ✓ API dependencies installed
echo.

cd ..

REM Setup Web
echo 🎨 Setting up Web...
cd web

if not exist .env (
    echo Creating .env file from .env.example...
    copy .env.example .env
    echo ✓ Created web\.env
) else (
    echo ⚠️  web\.env already exists, skipping...
)

echo Installing Web dependencies...
call npm install
echo ✓ Web dependencies installed
echo.

cd ..

REM Create data directory
echo 📁 Creating data directory...
if not exist api\data mkdir api\data
echo ✓ Data directory created
echo.

echo ✅ Setup complete!
echo.
echo To start development servers:
echo   npm run dev  (from root directory)
echo.
echo Or start services individually:
echo   cd api ^&^& npm run dev  (API server on http://localhost:8080)
echo   cd web ^&^& npm run dev  (Web UI on http://localhost:5173)
echo.
echo To start with Docker:
echo   docker-compose up -d
echo.
echo Happy coding! 🎉

pause

