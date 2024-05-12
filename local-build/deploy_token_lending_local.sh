#!/bin/bash
echo "Running deploy script...";
SOLANA_CONFIG=$1;
PROGRAM_ID=$2;
# Get OWNER from keypair_path key of the solana config file
OWNER=`grep 'keypair_path:' $SOLANA_CONFIG | awk '{print $2}'`;
MARKET_OWNER=`solana --config $SOLANA_CONFIG address`;

spl-token --config $SOLANA_CONFIG unwrap;

set -e;
echo "Using Solana config filepath: $SOLANA_CONFIG";
echo "Program ID: $PROGRAM_ID";
echo "Owner: $OWNER";
echo "Market Owner $MARKET_OWNER";

solana config set --url http://127.0.0.1:8899;

solana airdrop 10 $MARKET_OWNER;
SOURCE=`spl-token --config $SOLANA_CONFIG wrap 10 2>&1 | head -n1 | awk '{print $NF}'`;

solana program --config $SOLANA_CONFIG deploy \
  target/deploy/relend_program.so

echo "Creating Lending Market";
CREATE_MARKET_OUTPUT=`target/debug/relend-program --program $PROGRAM_ID create-market \
  --fee-payer    $OWNER \
  --market-owner $MARKET_OWNER \
  --verbose`;

echo "$CREATE_MARKET_OUTPUT";
MARKET_ADDR=`echo $CREATE_MARKET_OUTPUT | head -n1 | awk '{print $4}'`;
AUTHORITY_ADDR=`echo $CREATE_MARKET_OUTPUT | grep "Authority Address" | awk '{print $NF}'`;

# USDC Reserve
echo "Creating USDC Reserve";
USDC_TOKEN_MINT=`spl-token --config $SOLANA_CONFIG create-token --decimals 6 |  awk '{print $3}'`;
echo "USDC MINT: $USDC_TOKEN_MINT"
USDC_TOKEN_ACCOUNT=`spl-token --config $SOLANA_CONFIG create-account $USDC_TOKEN_MINT | awk '{print $3}'`;
spl-token --config $SOLANA_CONFIG mint $USDC_TOKEN_MINT 30000000;

USDC_RESERVE_OUTPUT=`target/debug/relend-program \
  --program $PROGRAM_ID \
  add-reserve \
  --fee-payer         $OWNER \
  --market-owner      $OWNER \
  --source-owner      $OWNER \
  --market            $MARKET_ADDR \
  --source            $USDC_TOKEN_ACCOUNT \
  --amount            500000  \
  --pyth-product      6NpdXrQEpmDZ3jZKmM2rhdmkd3H6QAk23j2x8bkXcHKA \
  --pyth-price        5SSkXsEKQepHHAewytPVwdej4epN1nxgLVM84L4KXgy7 \
  --switchboard-feed  CZx29wKMUxaJDq6aLVQTdViPL754tTR64NAgQBUGxxHb \
  --optimal-utilization-rate 80 \
  --loan-to-value-ratio 75      \
  --liquidation-bonus 5 \
  --liquidation-threshold 80 \
  --max-liquidation-threshold 100 \
  --min-borrow-rate 0   \
  --optimal-borrow-rate  8 \
  --max-borrow-rate 50 \
  --super-max-borrow-rate 100 \
  --added-borrow-weight-bps 10 \
  --max-liquidation-bonus 10 \
  --host-fee-percentage 50 \
  --max-utilization-rate 100 \
  --deposit-limit 1000000 \
  --borrow-limit 900000 \
  --protocol-liquidation-fee 5 \
  --protocol-take-rate 2 \
  --verbose`;
echo "$USDC_RESERVE_OUTPUT";

spl-token --config $SOLANA_CONFIG unwrap;

# Export variables for new config.ts file
CONFIG_TEMPLATE_FILE="https://raw.githubusercontent.com/solendprotocol/common/master/src/devnet_template.json"
# Token Mints
export USDC_MINT_ADDRESS="$USDC_TOKEN_MINT";
export ETH_MINT_ADDRESS="$ETH_TOKEN_MINT";
export BTC_MINT_ADDRESS="$BTC_TOKEN_MINT";

# Main Market
export MAIN_MARKET_ADDRESS="$MARKET_ADDR";
export MAIN_MARKET_AUTHORITY_ADDRESS="$AUTHORITY_ADDR";

# Reserves
export USDC_RESERVE_ADDRESS=`echo "$USDC_RESERVE_OUTPUT" | grep "Adding reserve" | awk '{print $NF}'`;
export USDC_RESERVE_COLLATERAL_MINT_ADDRESS=`echo "$USDC_RESERVE_OUTPUT" | grep "Adding collateral mint" | awk '{print $NF}'`;
export USDC_RESERVE_COLLATERAL_SUPPLY_ADDRESS=`echo "$USDC_RESERVE_OUTPUT" | grep "Adding collateral supply" | awk '{print $NF}'`;
export USDC_RESERVE_LIQUIDITY_ADDRESS=`echo "$USDC_RESERVE_OUTPUT" | grep "Adding liquidity supply" | awk '{print $NF}'`;
export USDC_RESERVE_LIQUIDITY_FEE_RECEIVER_ADDRESS=`echo "$USDC_RESERVE_OUTPUT" | grep "Adding liquidity fee receiver" | awk '{print $NF}'`;

export USDC_USER_COLLATERAL_SUPPLY_ADDRESS=`echo "$USDC_RESERVE_OUTPUT" | grep "Adding user collateral" | awk '{print $NF}'`;
echo "USER_COLLATERAL ${USDC_USER_COLLATERAL_SUPPLY_ADDRESS}"
echo "USDC RESERVE ADDRESS ${USDC_RESERVE_ADDRESS}"

# Run templating command 
curl $CONFIG_TEMPLATE_FILE | envsubst 

echo "USDC RESERVE $USDC_RESERVE_ADDRESS"

echo "INIT OBLIGATION FOR OWNER"

INIT_OBLIGATION_OUTPUT=`./target/debug/relend-program \
  --program $PROGRAM_ID init-obligation \
  --market $MARKET_ADDR \
  --verbose
  `;

ECHO "$INIT_OBLIGATION_OUTPUT"
export OBLIGATION_ADDRESS=`echo "$INIT_OBLIGATION_OUTPUT" | grep "Adding obligation" | awk '{print $NF}'`;

ECHO "DEPOSIT OBLIGATION FOR OWNER"
DEPOSIT_OBLIGATION_OUTPUT=`./target/debug/relend-program \
  --program $PROGRAM_ID deposit-obligation \
  --market $MARKET_ADDR \
  --reserve $USDC_RESERVE_ADDRESS \
  --user_collateral_pubkey $USDC_USER_COLLATERAL_SUPPLY_ADDRESS \
  --amount 100000 \
  --verbose
  `;

echo "$DEPOSIT_OBLIGATION_OUTPUT"