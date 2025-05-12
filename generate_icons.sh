#!/bin/bash

# 创建 icons 目录
mkdir -p icons

# 生成不同尺寸的图标
convert -background none -size 16x16 icon.svg icons/icon16.png
convert -background none -size 32x32 icon.svg icons/icon32.png
convert -background none -size 48x48 icon.svg icons/icon48.png
convert -background none -size 128x128 icon.svg icons/icon128.png

echo "Icons generated in icons directory:"
ls -l icons/