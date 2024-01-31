const fs = require("fs");
import * as anchor from "@project-serum/anchor";
import { Program, BN } from "@project-serum/anchor";
import {
  Connection,
  PublicKey,
  LAMPORTS_PER_SOL,
  Transaction,
  SystemProgram,
  sendAndConfirmTransaction,
  Keypair,
  SendTransactionError,
  Signer,
} from "@solana/web3.js";
import path from "path";
import { exec } from "child_process";
import { expect } from "chai";
import { AuthorityType, createMint, getAccount, getOrCreateAssociatedTokenAccount, mintTo, setAuthority } from "spl-token"; // version 0.2.0

const transferSol = async (
  connection: Connection,
  from: Keypair,
  to: PublicKey,
  amount: number,
) => {
  const tx = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: from.publicKey,
      toPubkey: to,
      lamports: LAMPORTS_PER_SOL * amount,
    }),
  );
  await sendAndConfirmTransaction(connection, tx, [from]);
};

describe("create-lending-market", () => {
  const endpoint = "https://api-testnet.renec.foundation:8899/";
  const connection = new Connection(endpoint, "confirmed");
  const feePayer = "./payer.json";
  const pathDir = path.join(__dirname, feePayer);
  const sourceKey = JSON.parse(fs.readFileSync(pathDir, "utf8"));
  const program_id = new PublicKey("HEkN76nRUYivp3hT8TYTVpz1kQCkp2TRixrhJ9Gpz6JJ");
  const keypair = Keypair.fromSecretKey(Uint8Array.from(sourceKey));
  let marketOwner = keypair.publicKey.toBase58();
  let lendingMarket: PublicKey;

  it("init", async () => {
    const currentExeDir = path.join(__dirname, "..");

    const createLendingMarketCmd =
      `RUST_BACKTRACE=1 ${currentExeDir}/target/debug/relend-program --program ${program_id} ` +
      `--url ${endpoint} --fee-payer ${pathDir} create-market --market-owner ${marketOwner}`
      ;

    exec(createLendingMarketCmd, { shell: "/bin/bash" }, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error: ${error.message}`);
        return;
      }
      const regex = /Creating lending market(.*?)Signature/gs;
      const matches = regex.exec(stdout);

      if (matches && matches[1]) {
        const result = matches[1].trim();
        lendingMarket = new PublicKey(result);
        console.log("lendingMarket: ", lendingMarket.toBase58());
      } else {
        console.log("No match found.");
        return;
      }
    });
  });
});
