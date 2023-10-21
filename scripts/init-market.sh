if [[ -n $1 ]]; then
    PROGRAM_ID=$1
else
    echo "Error: program id is not specify: $PROGRAM_ID"
    exit 1
fi

if [[ -n $2 ]]; then
    OWNER=$2
else
    echo "Error: the program owner is missing: $OWNER"
    exit 1
fi

if [[ -n $3 ]]; then
    PAYER=$3
else
    echo "Error: the payer is missing: $PAYER"
    exit 1
fi

echo "Program ID: $PROGRAM_ID";
echo "Owner: $OWNER";
echo "Payer $PAYER";

echo "Creating Lending Market";
CREATE_MARKET_OUTPUT=`target/debug/relend-program --program $PROGRAM_ID create-market \
  --fee-payer    $PAYER \
  --market-owner $OWNER \
  --verbose`;

echo "Use the market address below to add reserves in the next step:"
echo "$CREATE_MARKET_OUTPUT";