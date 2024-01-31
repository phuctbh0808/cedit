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

describe("create-reserve", () => {
  const endpoint = "https://api-testnet.renec.foundation:8899/";
  const connection = new Connection(endpoint, "confirmed");
  const feePayer = "./payer.json";
  const pathDir = path.join(__dirname, feePayer);
  const sourceKey = JSON.parse(fs.readFileSync(pathDir, "utf8"));
  const program_id = new PublicKey("HEkN76nRUYivp3hT8TYTVpz1kQCkp2TRixrhJ9Gpz6JJ");
  const keypair = Keypair.fromSecretKey(Uint8Array.from(sourceKey));
  let lendingMarket = new PublicKey("Az4r35znVaN5cHaWny8vcnk9zHR3VYStg67nEWt8EvPs");
  let mint = new PublicKey("GDT9qMLRJHwAJAiRdpcwagHcyp7rTXNn1zcVCgPG3Kaf");
  let sourceOwnerAta: PublicKey;

  it("init", async () => {
    sourceOwnerAta = (await getOrCreateAssociatedTokenAccount(
      connection,
      keypair,
      mint,
      keypair.publicKey
    )).address;

    const currentExeDir = path.join(__dirname, "..");

    let addReserveParam = [
      `--market-owner ${pathDir}`,
      `--source-owner ${pathDir}`,
      `--market ${lendingMarket.toBase58()}`,
      `--source ${sourceOwnerAta.toBase58()}`,
      `--amount 500`,
      `--optimal-utilization-rate 90`,
      `--max-utilization-rate 100`,
      `--loan-to-value-ratio 95`,
      `--liquidation-bonus 5`,
      `--liquidation-threshold 95`,
      `--max-liquidation-bonus 10`,
      `--max-liquidation-threshold 100`,
      `--min-borrow-rate 0 `,
      `--optimal-borrow-rate  8`,
      `--max-borrow-rate 200`,
      `--super-max-borrow-rate 300`,
      `--borrow-fee 0.1`,
      `--borrow-limit 2000000`,
      `--host-fee-percentage 20`,
      `--deposit-limit 5000000`,
      `--pyth-product 8jMh1d8NA84AZErW2uZ71Jbhci3PyV3WaySbVVLXGctt`,
      `--pyth-price nakiaURmuNcNS1nUwJzqKWU1x9CPXXfK4xVSK1utcL7`,
      `--switchboard-feed nakiaURmuNcNS1nUwJzqKWU1x9CPXXfK4xVSK1utcL7`,
      `--added-borrow-weight-bps 10`,
      `--reserve-type Regular`,
      `--protocol-take-rate 80`,
      `--verbose`,
    ];

    let addReserveCmd =
      `RUST_BACKTRACE=1 ${currentExeDir}/target/debug/relend-program --program ${program_id} ` +
      `--url ${endpoint} --fee-payer ${pathDir} add-reserve ` +
      addReserveParam.join(" ");

    exec(addReserveCmd, { shell: "/bin/bash" }, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error: ${error.message}`);
      }
      const regex = /Adding reserve(.*?)Adding collateral mint/gs;
      const matches = regex.exec(stdout);

      if (matches && matches[1]) {
        const reserve = matches[1].trim();
        console.log("reserve:", reserve)
      } else {
        console.log("No match found.");
        return;
      }
    });
  });
});
