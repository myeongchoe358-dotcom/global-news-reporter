#!/bin/bash

# 全球新闻日报系统 - 快速测试脚本
# Global News Reporter - Quick Test Script

echo "════════════════════════════════════════════════════════════════"
echo "🚀 Global News Reporter - Quick Test"
echo "════════════════════════════════════════════════════════════════"
echo ""

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    echo "   Download from: https://nodejs.org"
    exit 1
fi

echo "✓ Node.js found: $(node --version)"
echo ""

# 检查 npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed."
    exit 1
fi

echo "✓ npm found: $(npm --version)"
echo ""

# 进入项目目录
cd "$(dirname "$0")" || exit

# 安装依赖
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo ""
echo "✓ Dependencies installed"
echo ""

# 创建 .env 文件（如果不存在）
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cat > .env << EOF
NEWS_API_KEY=9c78bf1e115d4740aa643abe933
EMAIL_SERVICE=gmail
EMAIL_USER=myeongchoe358@gmail.com
EMAIL_PASSWORD=4d169
EMAIL_RECIPIENT=myeongchoe358@gmail.com
EMAIL_SENDER_NAME=全球新闻日报系统
NEWS_COUNT=10
TIMEZONE=Asia/Shanghai
LOG_LEVEL=info
NODE_ENV=production
EOF
    echo "✓ .env file created"
    echo ""
fi

# 运行测试
echo "════════════════════════════════════════════════════════════════"
echo "🧪 Running Test..."
echo "════════════════════════════════════════════════════════════════"
echo ""

node src/test-runner.js

TEST_RESULT=$?

echo ""
echo "════════════════════════════════════════════════════════════════"

if [ $TEST_RESULT -eq 0 ]; then
    echo "✅ TEST PASSED!"
    echo ""
    echo "📧 Check your email: myeongchoe358@gmail.com"
    echo "📁 Output files in: ./output/"
    echo ""
else
    echo "❌ TEST FAILED"
    echo "📋 Check logs for details"
    echo ""
fi

echo "════════════════════════════════════════════════════════════════"

exit $TEST_RESULT
