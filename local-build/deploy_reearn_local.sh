SOLANA_CONFIG=$1;
USDC_RESERVE=$2;
OBLIGATION=$3;


echo "SOLANA CONFIG $SOLANA_CONFIG";

MARKET_OWNER=`solana --config $SOLANA_CONFIG address`;
echo "OWNER ${MARKET_OWNER}"

PROGRAM_KEYPAIR_FILE="target/deploy/reearn_program-keypair.json"
PROGRAM_ID=`solana --config $SOLANA_CONFIG -k $PROGRAM_KEYPAIR_FILE address`

echo "Creating Reward token";
export REW_TOKEN_MINT=`spl-token --config $SOLANA_CONFIG create-token --decimals 6 |  awk '{print $3}'`;
echo "REW MINT: $REW_TOKEN_MINT"
REW_TOKEN_ACCOUNT=`spl-token --config $SOLANA_CONFIG create-account $REW_TOKEN_MINT | awk '{print $3}'`;
spl-token --config $SOLANA_CONFIG mint $REW_TOKEN_MINT 30000000;

echo "DEPLOY REEARN PROGRAM"
solana program deploy reearn/target/deploy/reearn_program.so

echo "INIT REEARN POOL"
npx ts-node src/index.ts init-reearn-pool --network_url http://127.0.0.1:8899 --program_id $PROGRAM_ID --authority ~/.config/renec/id.json

# echo "ENABLE GAUGE"
npx ts-node src/index.ts \
    enable-supply-gauge \
    --program_id $PROGRAM_ID \
    --network_url http://127.0.0.1:8899 \
    --admin_key $MARKET_OWNER \
    --source ~/.config/renec/id.json \
    --reserve $USDC_RESERVE \
    --reward $REW_TOKEN_MINT \
    --reward_decimals 6 \
    --apy 1.2 \
    --start_time "22/05/2024 20:00" \
    --end_time "23/05/2024 20:00"

echo "SUPPLY TO EARN"
npx ts-node src/index.ts \
    supply-to-earn \
    --program_id $PROGRAM_ID \
    --network_url http://127.0.0.1:8899 \
    --source ~/.config/renec/id.json \
    --reserve $USDC_RESERVE \
    --obligation $OBLIGATION \
