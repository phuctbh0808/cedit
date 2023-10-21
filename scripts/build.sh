PROGRAM_NAME_UNDERSCORE=${PROGRAM_NAME//-/_}

if [[ -n $1 ]]; then
    PROGRAM_ID=$1
else
    PROGRAM_ID_FILE="token-lending/program/program-id.md"
    PROGRAM_ID=$(cat $PROGRAM_ID_FILE) # Load content from file
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
sed "s/solana_program::declare_id!([^)]*)/solana_program::declare_id!(\"$PROGRAM_ID\")/" "$FILE_PATH" > "$TEMP_FILE"
cat "$TEMP_FILE" > "$FILE_PATH"
rm "$TEMP_FILE"

# Build the program 
cargo build
cargo build-bpf

# For .env
FILE=".env"
if [ ! -f "$FILE" ]; then
  cp $FILE.example $FILE
fi
sed -i.bak "s/^PROGRAM_ID=.*/PROGRAM_ID=$PROGRAM_ID/" $FILE && rm $FILE.bak