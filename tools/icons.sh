#!/bin/sh
# Renders the PNG icons and the social preview from the SVG sources (needs rsvg-convert).
set -e
cd "$(dirname "$0")/.."
rsvg-convert -w 192 -h 192 public/icons/icon.svg -o public/icons/icon-192.png
rsvg-convert -w 512 -h 512 public/icons/icon.svg -o public/icons/icon-512.png
rsvg-convert -w 180 -h 180 tools/maskable.svg -o public/icons/apple-touch-icon.png
rsvg-convert -w 512 -h 512 tools/maskable.svg -o public/icons/maskable-512.png
rsvg-convert -w 1200 -h 630 tools/og.svg -o public/og.png
echo "icons rendered"
