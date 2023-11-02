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
    MARKET=$3
else
    echo "Error: the market is missing: $MARKET"
    exit 1
fi

if [[ -n $4 ]]; then
    RESERVE=$4
else
    echo "Error: the reserve is missing: $RESERVE"
    exit 1
fi

if [[ -n $5 ]]; then
    BORROW_FEE=$5
else
    echo "Error: the borrow fee is missing: $BORROW_FEE"
    exit 1
fi

echo "Program ID: $PROGRAM_ID";
echo "Owner: $OWNER";
echo "Market $MARKET";
echo "Reserve $RESERVE";
echo "Borrow Fee $BORROW_FEE";

echo "Updating reserve";
UPDATE_RESERVE_OUTPUT=`target/debug/relend-program --program $PROGRAM_ID --fee-payer $OWNER update-reserve \
    --market $MARKET \
    --reserve $RESERVE \
    --market-owner $OWNER \
    --borrow-fee $BORROW_FEE \
    --verbose`;

echo "$UPDATE_RESERVE_OUTPUT";