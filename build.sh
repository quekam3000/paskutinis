#!/bin/bash

# Įdiegti yt-dlp
apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    && pip3 install yt-dlp

# Įdiegti npm priklausomybes
npm install