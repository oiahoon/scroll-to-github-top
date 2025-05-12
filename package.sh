#!/bin/bash

# 设置版本号
VERSION=$(grep '"version":' manifest.json | cut -d'"' -f4)
echo "Packaging version $VERSION..."

# 创建临时目录
TEMP_DIR="scroll-to-github-top-$VERSION"
mkdir -p "$TEMP_DIR"

# 复制必要的文件
cp manifest.json "$TEMP_DIR/"
cp button.js "$TEMP_DIR/"
cp catalog.js "$TEMP_DIR/"
cp toc.css "$TEMP_DIR/"
cp -r icons "$TEMP_DIR/"
cp LICENSE "$TEMP_DIR/"
cp README.md "$TEMP_DIR/"
cp CHANGELOG.md "$TEMP_DIR/"

# 创建 ZIP 文件
zip -r "scroll-to-github-top-$VERSION.zip" "$TEMP_DIR"

# 清理临时目录
rm -rf "$TEMP_DIR"

echo "Package created: scroll-to-github-top-$VERSION.zip"