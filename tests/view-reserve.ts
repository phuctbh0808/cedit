import {
  PublicKey,
} from "@solana/web3.js";
import path from "path";
import { exec } from "child_process";

describe("view-reserve", () => {
  const endpoint = "https://api-testnet.renec.foundation:8899/";
  const program_id = new PublicKey("HEkN76nRUYivp3hT8TYTVpz1kQCkp2TRixrhJ9Gpz6JJ");
  let reserve = new PublicKey("FDPmQPqwxmzCSR8TVWkhePCTD7aMj61kBrhBKhKJi5o9");

  it("init", async () => {
    const currentExeDir = path.join(__dirname, "..");

    let viewReserveParam = [
      `--reserve ${reserve.toBase58()}`,
    ];

    let viewReserveCmd =
      `RUST_BACKTRACE=1 ${currentExeDir}/target/debug/relend-program --program ${program_id} ` +
      `--url ${endpoint} view-reserve ` +
      viewReserveParam.join(" ");

    exec(viewReserveCmd, { shell: "/bin/bash" }, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error: ${error.message}`);
        return;
      }
      console.log("stdout: ", stdout);
    });
  });
});
