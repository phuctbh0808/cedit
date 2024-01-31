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

describe("view-market", () => {
  const endpoint = "https://api-testnet.renec.foundation:8899/";
  const connection = new Connection(endpoint, "confirmed");
  const feePayer = "./payer.json";
  const pathDir = path.join(__dirname, feePayer);
  const sourceKey = JSON.parse(fs.readFileSync(pathDir, "utf8"));
  const program_id = new PublicKey("HEkN76nRUYivp3hT8TYTVpz1kQCkp2TRixrhJ9Gpz6JJ");
  const keypair = Keypair.fromSecretKey(Uint8Array.from(sourceKey));
  let lendingMarket = new PublicKey("Az4r35znVaN5cHaWny8vcnk9zHR3VYStg67nEWt8EvPs");
  let expectRiskAuthority = new PublicKey("CmuuJTHeDxswM4JBgu65Ptk21qzoio2XPFRrPJ7Gm151");

  it("init", async () => {
    const currentExeDir = path.join(__dirname, "..");

    let viewMarketParam = [
      `--market ${lendingMarket.toBase58()}`,
    ];

    let viewMarketCmd =
      `RUST_BACKTRACE=1 ${currentExeDir}/target/debug/relend-program --program ${program_id} ` +
      `--url ${endpoint} view-market ` +
      viewMarketParam.join(" ");

    exec(viewMarketCmd, { shell: "/bin/bash" }, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error: ${error.message}`);
        return;
      }

      let match = stdout.match(/risk_authority: (.*?),/);
      if (match && match[1]) {
        let resultString = match[1];
        console.log("risk_authority: ", resultString);
        if (resultString == expectRiskAuthority.toBase58()) {
          console.log("ok");
          return;
        }
      } else {
        console.log("failed");
        return;
      }
    });
  });
});
