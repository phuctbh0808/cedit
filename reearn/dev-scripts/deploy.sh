if [[ -n $1 ]]; then
    WALLET_PATH=$1
else
    echo "Error: deployer not found: $WALLET_PATH"
    exit 1
fi

if [[ -n $2 ]]; then
    PROGRAM_ID=$2
else
    echo "Error: program id not found: $PROGRAM_ID"
    exit 1
fi

PROGRAM_NAME_UNDERSCORE=${REEARN_PROGRAM//-/_}
solana program deploy target/deploy/$PROGRAM_NAME_UNDERSCORE.so --keypair $WALLET_PATH --url $CLUSTER_URL --program-id $PROGRAM_ID