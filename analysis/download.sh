#!/bin/bash
# Download all FlashMotion portfolio videos at 720p
# Uses yt-dlp with parallel downloads

DIR="/Users/ysnows/Documents/video-maker/analysis/videos"
cd "$DIR"

IDS=(
WLTjrAl6sT0 74lpKobtucY tkdA4bGzlNc DLj3z9rtpBo _cUfI2GO1Hs
KTATrZ2YsLc NxGYez-NLJQ _KFnXMf7vuc G2jzT_JBYJM LmUmSDo0PQ8
xxNX8gIxoLI 90r5N6ukjsc DvvOLP174v8 4IxrH8xota8 EwkmGxwG8uw
3S-VVUmy_0w R4mGGCHkifg qPC1fC7GNwc bYQJjM2Xpf4 X3wzzdFweO4
thV4kqYclHg kQc_xfFtNtI gEpL0ovciIc Bwa2HbxOURk eXK6-BmbU7o
KuE_S9Cj60g EaQsSPOsAmE a05baYEJkS4 JGseMqRS6aM gpuevrTxYf4
3NeUUuRIxZo eIYQ1A8Zgro YMUNXZ6_LL0 L3l4ePO6-5g MTYFUaD8IM8
BTvhyYHxHLo pxRBep52txU afXSqJCvlFg 7vI0p4HTyrE kYGHnU9BUzw
mVIshJK0zhA XnC8tX7PT2I BCCEvPDlC6M tROeWnT2fAQ AHkksCMmMUQ
L4guEqLxB2E bdDAcZUE8Uw J2iJW5ecvfo 2yW_f_PxqmE 0MTDr-hcABs
evO0Dj-rDrw lk-grXVR1GE VJWQMD4z6_c fBvDpMYv264 5bP-hRzKoK4
VPHOIsn6brA lowxFz89Ano g_V23Wl8rcY 2bI2mFek-PI lllKSjUTsKo
lW8YT4VUfLI 3dWjP8GgunY hQiK-O1ni9A pnUHR5KP_9A CP5QbjiniGo
MQbUNb8eKNg JQCeTRtGLHk VXK2ZUm8wrk JQLum-d3k6c 7Y1sOpRIXFw
cuVANEytZpw sX7zfzngTFs UP3RAWNzZow DLTlqN2vkk0 10peX5N8Q2I
5GcXYGoK1sI xuiZhWBQPJM 2iFc4mdKjJY
)

TOTAL=${#IDS[@]}
echo "Downloading $TOTAL videos to $DIR"

download_video() {
    local id=$1
    local idx=$2
    local total=$3
    echo "[$idx/$total] Downloading $id..."
    yt-dlp -f "bestvideo[height<=720]+bestaudio/best[height<=720]/best" \
        --merge-output-format mp4 \
        -o "%(id)s.mp4" \
        --no-playlist \
        --quiet --no-warnings \
        "https://www.youtube.com/watch?v=$id" 2>/dev/null
    if [ $? -eq 0 ]; then
        echo "[$idx/$total] Done: $id"
    else
        echo "[$idx/$total] FAILED: $id"
    fi
}

export -f download_video

IDX=0
for id in "${IDS[@]}"; do
    IDX=$((IDX + 1))
    if [ -f "${id}.mp4" ]; then
        echo "[$IDX/$TOTAL] Skip (exists): $id"
        continue
    fi
    download_video "$id" "$IDX" "$TOTAL" &
    # Limit to 6 parallel downloads
    if [ $((IDX % 6)) -eq 0 ]; then
        wait
    fi
done
wait

echo ""
echo "Download complete. Files:"
ls -lh "$DIR"/*.mp4 2>/dev/null | wc -l
echo "videos downloaded."
