#!/bin/bash

# mc-upload.sh - Upload a local file to your Minecraft server

if [ -z "$2" ]; then
  echo "Usage: ./mc-upload.sh <local_file> <remote_path>"
  echo "Example: ./mc-upload.sh ~/Downloads/WorldEdit.jar plugins/WorldEdit.jar"
  exit 1
fi

LOCAL_FILE=$1
REMOTE_PATH=$2

if [ ! -f "$LOCAL_FILE" ]; then
  echo "Local file not found: $LOCAL_FILE"
  exit 1
fi

echo "Uploading $LOCAL_FILE to $REMOTE_PATH..."
curl -# -k -T "$LOCAL_FILE" -u "catfanny13@gmail.com|946f16b4:mTuXpbz4Z3LNSK" "sftp://meowtopia-panel.duckdns.org:5657/$REMOTE_PATH"

if [ $? -eq 0 ]; then
  echo "Success!"
else
  echo "Failed to upload."
fi
