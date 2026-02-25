#!/bin/bash

# 设置版本号
VERSION=$(grep '"version":' manifest.json | cut -d'"' -f4)
echo "Packaging version $VERSION..."

# 创建临时目录
TEMP_DIR="smart-toc-scroll-$VERSION"
mkdir -p "$TEMP_DIR"

# 复制必要的文件
cp manifest.json "$TEMP_DIR/"
cp catalog.js "$TEMP_DIR/"
cp theme.js "$TEMP_DIR/"
cp toc.css "$TEMP_DIR/"
cp themes.css "$TEMP_DIR/"
cp options.html "$TEMP_DIR/"
cp options.css "$TEMP_DIR/"
cp options.js "$TEMP_DIR/"
cp -r icons "$TEMP_DIR/"
cp LICENSE "$TEMP_DIR/"
cp README.md "$TEMP_DIR/"
cp CHANGELOG.md "$TEMP_DIR/"

# 进入临时目录，打包所有内容到 zip 根目录
cd "$TEMP_DIR"
zip -r "../smart-toc-scroll-$VERSION.zip" ./*
cd ..

# 清理临时目录
rm -rf "$TEMP_DIR"

echo "Package created: smart-toc-scroll-$VERSION.zip"
