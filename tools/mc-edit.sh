#!/bin/bash

# mc-edit.sh - Edit your Minecraft server files in real-time from your terminal

if [ -z "$1" ]; then
  echo "Usage: ./mc-edit.sh <path/to/file>"
  echo "Example: ./mc-edit.sh plugins/Essentials/config.yml"
  exit 1
fi

FILE=$1
TMP_FILE="/tmp/mc-edit-$(basename $FILE)"

echo "Downloading $FILE..."
# Download the file via SFTP using curl (which bypasses the SSH pipe character bug)
curl -s -k -u "catfanny13@gmail.com|946f16b4:mTuXpbz4Z3LNSK" "sftp://meowtopia-panel.duckdns.org:5657/$FILE" -o "$TMP_FILE"

if [ $? -ne 0 ]; then
  echo "Error downloading file. Does it exist?"
  exit 1
fi

# Open in the user's preferred editor (defaults to nano)
${EDITOR:-nano} "$TMP_FILE"

echo "Uploading $FILE..."
# Upload the modified file back
curl -s -k -T "$TMP_FILE" -u "catfanny13@gmail.com|946f16b4:mTuXpbz4Z3LNSK" "sftp://meowtopia-panel.duckdns.org:5657/$FILE"

if [ $? -eq 0 ]; then
  echo "Successfully saved $FILE to the server!"
else
  echo "Failed to upload file."
fi

# Clean up
rm "$TMP_FILE"
