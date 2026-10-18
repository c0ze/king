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
# Android launcher icons (legacy, adaptive foreground, monochrome) and the TWA splash image
R=android/app/src/main/res
for d in mdpi:48:108 hdpi:72:162 xhdpi:96:216 xxhdpi:144:324 xxxhdpi:192:432; do
  n=${d%%:*}; rest=${d#*:}; legacy=${rest%%:*}; fg=${rest#*:}
  mkdir -p $R/mipmap-$n
  rsvg-convert -w $legacy -h $legacy public/icons/icon.svg -o $R/mipmap-$n/ic_launcher.png
  rsvg-convert -w $fg -h $fg tools/android-fg.svg -o $R/mipmap-$n/ic_launcher_foreground.png
  rsvg-convert -w $fg -h $fg tools/android-mono.svg -o $R/mipmap-$n/ic_launcher_monochrome.png
done
rsvg-convert -w 384 -h 384 tools/android-fg.svg -o $R/drawable-nodpi/splash.png
echo "android icons rendered"
rsvg-convert -w 1024 -h 500 tools/feature.svg -o docs/store/feature-graphic.png
