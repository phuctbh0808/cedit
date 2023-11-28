# Relend Lending program

The Relend lending protocol is based on the token-lending program authored by [Solana labs](https://github.com/solana-labs/solana-program-library).

### Deploy a lending program

1. [Install the Solana CLI](https://docs.solana.com/cli/install-solana-cli-tools)

2. Install the Token and Token Lending CLIs:
   ```shell
   cargo install spl-token-cli
   cargo install solend-program-cli
   ```
   

3. Generate a keypair for yourself:
   ```shell
   solana-keygen new -o owner.json

   # Wrote new keypair to owner.json
   # ================================================================================
   # pubkey: JAgN4SZLNeCo9KTnr8EWt4FzEV1UDgHkcZwkVtWtfp6P
   # ================================================================================
   # Save this seed phrase and your BIP39 passphrase to recover your new keypair:
   # your seed words here never share them not even with your mom
   # ================================================================================
   ```
   This pubkey will be the owner of the lending market that can add reserves to it.

4. Generate a keypair for the program:
   ```shell
   solana-keygen new -o lending.json

   # Wrote new keypair to lending.json
   # ============================================================================
   # pubkey: 6TvznH3B2e3p2mbhufNBpgSrLx6UkgvxtVQvopEZ2kuH
   # ============================================================================
   # Save this seed phrase and your BIP39 passphrase to recover your new keypair:
   # your seed words here never share them not even with your mom
   # ============================================================================
   ```
   This pubkey will be your Program ID.

5. Open `./token-lending/program/src/lib.rs` in your editor. In the line
   ```rust
   solana_program::declare_id!("6TvznH3B2e3p2mbhufNBpgSrLx6UkgvxtVQvopEZ2kuH");
   ```
   replace the Program ID with yours.

6. Build the program binaries:
   ```shell
   cargo build
   cargo build-bpf
   ```

7. Prepare to deploy to testnet:
   ```shell
   solana config set --url <testnet-url>
   ```

1. Score yourself some sweet RENEC:
   ```shell
   solana airdrop -k owner.json 10
   solana airdrop -k owner.json 10
   solana airdrop -k owner.json 10
   ```
   You'll use this for transaction fees, rent for your program accounts, and initial reserve liquidity.

1. Deploy the program:
   ```shell
   solana program deploy \
     -k owner.json \
     --program-id lending.json \
     target/deploy/solend_program.so

   # Program Id: 6TvznH3B2e3p2mbhufNBpgSrLx6UkgvxtVQvopEZ2kuH
   ```
   If the deployment doesn't succeed, follow [this guide](https://docs.solana.com/cli/deploy-a-program#resuming-a-failed-deploy) to resume it.

1. Wrap some of your RENEC as an SPL Token:
   ```shell
   spl-token wrap \
      --fee-payer owner.json \
      10.0 \
      -- owner.json

   # Wrapping 10 RENEC into AJ2sgpgj6ZeQazPPiDyTYqN9vbj58QMaZQykB9Sr6XY
   ```
   You'll use this for initial reserve liquidity. Note the SPL Token account pubkey (e.g. `AJ2sgpgj6ZeQazPPiDyTYqN9vbj58QMaZQykB9Sr6XY`).

1. Use the [Token Lending CLI](./cli/README.md) to create a lending market and add reserves to it.
