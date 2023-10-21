PROGRAM_NAME_UNDERSCORE=${PROGRAM_NAME//-/_}

if [[ -n $1 ]]; then
    PROGRAM_ID=$1
else
    PROGRAM_ID=$(solana address -k target/deploy/$PROGRAM_NAME_UNDERSCORE-keypair.json)
fi
echo "PROGRAM_ID: $PROGRAM_ID"

# Set the file path
FILE_PATH="token-lending/program/src/lib.rs"

# Make sure the file exists
if [ ! -f "$FILE_PATH" ]; then
    echo "Error: File not found: $FILE_PATH"
    exit 1
fi

echo $PROGRAM_ID

# Replace the existing declare_id! line with the new PROGRAM_ID
TEMP_FILE=$(mktemp)
awk -v program_id="$PROGRAM_ID" \
    '{gsub(/declare_id!\("[A-Za-z0-9]+"\);/, "declare_id!(\""program_id"\");")}1' \
    "$FILE_PATH" > "$TEMP_FILE"
cat "$TEMP_FILE" > "$FILE_PATH"
rm "$TEMP_FILE"

# Print the updated declare_id! line
echo "updated file: $(grep -E 'declare_id!\("[A-Za-z0-9]+"\);' "$FILE_PATH")"


# Build the program 
cargo build
cargo build-bpf

# For .env
FILE=".env"
if [ ! -f "$FILE" ]; then
  cp $FILE.example $FILE
fi
sed -i.bak "s/^PROGRAM_ID=.*/PROGRAM_ID=$PROGRAM_ID/" $FILE && rm $FILE.bak