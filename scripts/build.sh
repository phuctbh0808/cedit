PROGRAM_NAME_UNDERSCORE=${PROGRAM_NAME//-/_}

if [[ -n $1 ]]; then
    PROGRAM_ID=$1
else
    anchor keys list
    PROGRAM_ID=$(solana address -k target/deploy/$PROGRAM_NAME_UNDERSCORE-keypair.json)
fi
echo "PROGRAM_ID: $PROGRAM_ID"

# Set program id to anchor config for consistency
ANCHOR_FILE_PATH="programs/relend_program/src/lib.rs"
# Replace the existing declare_id! line with the new PROGRAM_ID
TEMP_FILE=$(mktemp)
sed "s/solana_program::declare_id!([^)]*)/solana_program::declare_id!(\"$PROGRAM_ID\")/" "$ANCHOR_FILE_PATH" > "$TEMP_FILE"
cat "$TEMP_FILE" > "$ANCHOR_FILE_PATH"
rm "$TEMP_FILE"


# Set program id to md file
PROGRAM_ID_FILE="token-lending/program/program-id.md"
echo $PROGRAM_ID > "$PROGRAM_ID_FILE"


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