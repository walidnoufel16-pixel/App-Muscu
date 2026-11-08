#!/bin/bash
# Usage : PACK=/tmp/pack ./video.sh <nom> <sortie.mp4>
# Assemble $PACK/scenes/<nom>/f0001.jpg … (faites par scenes.mjs, 30 images/s) en MP4 H.264 1080×1920,
# avec une piste son muette : le son tendance s'ajoute dans l'app au moment de publier.
# Vérifie ensuite quelques images : ffmpeg -i <sortie.mp4> -vf fps=2,scale=270:-1,tile=8x1 -frames:v 1 planche.png
set -e
P=${PACK:-/tmp/pack}; N=$1; OUT=$2
[ -f "$P/scenes/$N/f0001.jpg" ] || { echo "pas d'images dans $P/scenes/$N : lance d'abord scenes.mjs $N" >&2; exit 1; }
ffmpeg -y -loglevel error -framerate 30 -i "$P/scenes/$N/f%04d.jpg" -f lavfi -i anullsrc=r=44100:cl=stereo \
  -map 0:v -map 1:a -shortest -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p -r 30 \
  -c:a aac -b:a 64k -movflags +faststart "$OUT"
