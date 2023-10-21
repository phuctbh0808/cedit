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
    MARKET_OWNER=$3
else
    echo "Error: the market owner is missing: $MARKET_OWNER"
    exit 1
fi

echo "Program ID: $PROGRAM_ID";
echo "Owner: $OWNER";
echo "Market Owner $MARKET_OWNER";

echo "Creating Lending Market";
CREATE_MARKET_OUTPUT=`target/debug/relend-program create-market \
  --program      $PROGRAM_ID \
  --fee-payer    $OWNER \
  --market-owner $MARKET_OWNER \
  --verbose`;

echo "$CREATE_MARKET_OUTPUT";
MARKET_ADDR=`echo $CREATE_MARKET_OUTPUT | head -n1 | awk '{print $4}'`;
sed -i.bak "s/^MARKET_ADDR=.*/MARKET_ADDR=$MARKET_ADDR/" $FILE && rm $FILE.bak