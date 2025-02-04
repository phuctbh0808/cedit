# RPL Token Lending CLI

A basic command line interface for initializing lending markets and reserves for RPL Token Lending.

## Install the CLI

```

## Create a lending market

A lending market is a collection of reserves that can be configured to borrow and lend with each other.

The lending market owner must sign to add reserves.

### Usage
```shell
relend-program \
  --program      PUBKEY \
  --fee-payer    SIGNER \
  create-market \
  --market-owner PUBKEY
```
- `--program` is the lending program ID.
- `--fee-payer` will sign to pay transaction fees.
- `--market-owner` is the lending market owner pubkey.

Run `relend-program create-market --help` for more details and options.

### Example
```shell
relend-program \
  --program      6TvznH3B2e3p2mbhufNBpgSrLx6UkgvxtVQvopEZ2kuH \
  --fee-payer    owner.json \
  create-market \
  --market-owner JAgN4SZLNeCo9KTnr8EWt4FzEV1UDgHkcZwkVtWtfp6P

# Creating lending market 7uX9ywsk1X2j6wLoywMDVQLNWAqhDpVqZzL4qm4CuMMT
# Signature: 51mi4Ve42h4PQ1RXjfz141T6KCdqnB3UDyhEejviVHrX4SnQCMx86TZa9CWUT3efFYkkmfmseG5ZQr2TZTHJ8S95
```
Note the lending market pubkey (e.g. `7uX9ywsk1X2j6wLoywMDVQLNWAqhDpVqZzL4qm4CuMMT`). You'll use this to add reserves.

## Add a reserve to your market

A reserve is a liquidity pool that can be deposited into, borrowed from, and optionally used as collateral for borrows.

### Usage
```shell
relend-program \
  --program      PUBKEY \
  --fee-payer    SIGNER \
  add-reserve \
  --market-owner SIGNER \
  --source-owner SIGNER \
  --market       PUBKEY \
  --source       PUBKEY \
  --amount       DECIMAL_AMOUNT \
  --pyth-product PUBKEY \
  --pyth-price   PUBKEY
```
- `--program` is the lending program ID.
- `--fee-payer` will sign to pay transaction fees.
- `--market-owner` will sign as the lending market owner.
- `--source-owner` will sign as the source liquidity owner.
- `--market` is the lending market pubkey.
- `--source` is the SPL Token account pubkey (owned by `--source-owner`).
- `--amount` is the amount of tokens to deposit.
- `--pyth-product` and `--pyth-price` are oracle
  accounts [provided by Pyth](https://pyth.network/developers/consumers/accounts).

Run `relend-program add-reserve --help` for more details and options.

### Example
```shell
relend-program \
  --program      6TvznH3B2e3p2mbhufNBpgSrLx6UkgvxtVQvopEZ2kuH \
  --fee-payer    owner.json \
  add-reserve \
  --market-owner owner.json \
  --source-owner owner.json \
  --market       7uX9ywsk1X2j6wLoywMDVQLNWAqhDpVqZzL4qm4CuMMT \
  --source       AJ2sgpgj6ZeQazPPiDyTYqN9vbj58QMaZQykB9Sr6XY \
  --amount       5.0  \
  --pyth-product 8yrQMUyJRnCJ72NWwMiPV9dNGw465Z8bKUvnUC8P5L6F \
  --pyth-price   BdgHsXrH1mXqhdosXavYxZgX6bGqTdj5mh2sxDhF8bJy

# Adding reserve 69BwFhpQBzZfcp9MCj9V8TLvdv9zGfQQPQbb8dUHsaEa
# Signature: 2yKHnmBSqBpbGdsxW75nnmZMys1bZMbHiczdZitMeQHYdpis4eVhuMWGE29hhgtHpNDjdPj5YVbqkWoAEBw1WaU
# Signature: 33x8gbn2RkiA5844eCZq151DuVrYTvUoF1bQ5xA3mqkibJZaJja2hj8RoyjKZpZqg2ckcSKMAeqWbMeWC6vAySQS
# Signature: 3dk79hSgzFhxPrmctYnS5dxRhojfKkDwwLxEda9bTXqVELHSL4ux8au4jwvL8xuraVhaZAmugCn4TA1YCfLM4sVL
```

Note the reserve pubkey (e.g. `69BwFhpQBzZfcp9MCj9V8TLvdv9zGfQQPQbb8dUHsaEa`). You'll use this to deposit liquidity, redeem collateral, borrow, repay, and liquidate.
