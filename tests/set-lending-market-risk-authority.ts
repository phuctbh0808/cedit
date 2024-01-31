const fs = require("fs");
import {
  PublicKey,
} from "@solana/web3.js";
import path from "path";
import { exec } from "child_process";


describe("set-lending-market-risk-authority", () => {
  const endpoint = "https://api-testnet.renec.foundation:8899/";
  const feePayer = "./payer.json";
  const pathDir = path.join(__dirname, feePayer);
  const program_id = new PublicKey("HEkN76nRUYivp3hT8TYTVpz1kQCkp2TRixrhJ9Gpz6JJ");
  let lendingMarket = new PublicKey("Az4r35znVaN5cHaWny8vcnk9zHR3VYStg67nEWt8EvPs");
  let riskAuthority = new PublicKey("CmuuJTHeDxswM4JBgu65Ptk21qzoio2XPFRrPJ7Gm151");

  it("set successfully", async () => {
    const currentExeDir = path.join(__dirname, "..");

    let setRiskAuthorityParam = [
      `--market-owner ${pathDir}`,
      `--market ${lendingMarket.toBase58()}`,
      `--risk-authority ${riskAuthority.toBase58()}`,
      `--verbose`,
    ];

    let setRiskAuthorityCmd =
      `RUST_BACKTRACE=1 ${currentExeDir}/target/debug/relend-program --program ${program_id} ` +
      `--url ${endpoint} --fee-payer ${pathDir} set-lending-market-risk-authority ` +
      setRiskAuthorityParam.join(" ");

    exec(setRiskAuthorityCmd, { shell: "/bin/bash" }, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error: ${error.message}`);
        return;
      }
      console.log("risk_authority: ", riskAuthority.toBase58());
    });
  });
});
