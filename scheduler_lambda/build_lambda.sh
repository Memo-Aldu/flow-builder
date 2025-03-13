#!/usr/bin/env bash
set -e

cd "$(dirname "$0")"

BUILD_DIR="build_temp"
ZIP_NAME="scheduler_lambda.zip"

# 1. Remove old artifacts
rm -rf "$BUILD_DIR" "$ZIP_NAME"
mkdir -p "$BUILD_DIR"

# 2. Upgrade pip so that it supports --platform
pip install --upgrade pip

# 3. Install all dependencies for Linux/Python3.9
pip install \
  --platform manylinux2014_x86_64 \
  --implementation cp \
  --python-version 39 \
  --only-binary=:all: \
  --target "$BUILD_DIR" \
  -r requirements.txt

# 4. Copy your handler.py
cp handler.py "$BUILD_DIR"/

# 5. Copy your shared folder so imports like "from shared import db" work
cp -r ../shared "$BUILD_DIR"/

# 6. Zip everything
cd "$BUILD_DIR"
zip -r "../$ZIP_NAME" .
cd ..

# 7. Remove build folder
rm -rf "$BUILD_DIR"

echo "Build complete! Created $ZIP_NAME in $(pwd)."
