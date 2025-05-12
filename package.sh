#!/bin/bash

# 创建临时目录
mkdir -p dist

# 复制必要的文件到dist目录
cp manifest.json dist/
cp icon.svg dist/
cp material-button.css dist/
cp material-tree.css dist/
cp button.js dist/
cp catalog.js dist/
cp jquery.min.js dist/
cp jstree.min.js dist/
cp jstree.min.css dist/
cp LICENSE dist/
cp README.md dist/
cp CHANGELOG.md dist/

# 创建zip文件
cd dist
zip -r ../scroll-to-github-top-v1.9.zip *
cd ..

# 清理临时目录
rm -rf dist

echo "Package created: scroll-to-github-top-v1.9.zip"