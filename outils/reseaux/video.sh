#!/bin/bash
# Usage : PACK=/tmp/pack ./video.sh <nom> <sortie.mp4> (lit $PACK/scenes/<nom>-1..N.png)
# video.sh <nom> <sortie> : assemble scenes/<nom>-1..5.png en MP4 1080x1920, fondu entre scènes, léger zoom
P=${PACK:-/tmp/pack}; N=$1; OUT=$2
D=3.4; DF=2.6; X=0.35; FPS=30
args=(); filt=""; n=$(ls $P/scenes/$N-*.png | wc -l)
for i in $(seq 1 $n); do
  d=$D; [ $i -eq $n ] && d=$DF
  args+=(-i $P/scenes/$N-$i.png)
  fr=$(python3 -c "print(int($d*$FPS))")
  filt+="[$((i-1)):v]scale=2160:3840,zoompan=z='1+0.035*on/$fr':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=$fr:s=1080x1920:fps=$FPS,format=yuv420p,setsar=1[v$i];"
done
prev="v1"; off=0
for i in $(seq 2 $n); do
  off=$(python3 -c "print(round($off+$D-$X,3))")
  filt+="[$prev][v$i]xfade=transition=fade:duration=$X:offset=$off[x$i];"; prev="x$i"
done
ffmpeg -y -loglevel error "${args[@]}" -f lavfi -i anullsrc=r=44100:cl=stereo -filter_complex "${filt%;}" -map "[$prev]" -map $n:a -shortest -c:v libx264 -preset slow -crf 20 -pix_fmt yuv420p -r $FPS -c:a aac -b:a 64k -movflags +faststart "$OUT"
