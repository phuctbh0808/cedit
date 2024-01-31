import {
  PublicKey,
} from "@solana/web3.js";
import path from "path";
import { exec } from "child_process";
import { expect } from "chai";

describe("update-reserve-config", () => {
  const endpoint = "https://api-testnet.renec.foundation:8899/";
  const feePayer = "./risk_authority.json";
  const pathDir = path.join(__dirname, feePayer);
  const program_id = new PublicKey("HEkN76nRUYivp3hT8TYTVpz1kQCkp2TRixrhJ9Gpz6JJ");
  let lendingMarket = new PublicKey("Az4r35znVaN5cHaWny8vcnk9zHR3VYStg67nEWt8EvPs");
  let reserve = new PublicKey("FDPmQPqwxmzCSR8TVWkhePCTD7aMj61kBrhBKhKJi5o9");

  it("update successfully", async () => {
    const currentExeDir = path.join(__dirname, "..");

    let updateReserveParam = [
      `--market-owner ${pathDir}`,
      `--market ${lendingMarket.toBase58()}`,
      `--reserve ${reserve.toBase58()}`,
      `--borrow-fee 0.2`,
      // `--borrow-limit 2000000`,
      // `--host-fee-percentage 20`,
      // `--deposit-limit 5000000`,
      // `--pyth-product 8jMh1d8NA84AZErW2uZ71Jbhci3PyV3WaySbVVLXGctt`,
      // `--pyth-price nakiaURmuNcNS1nUwJzqKWU1x9CPXXfK4xVSK1utcL7`,
      // `--switchboard-feed nakiaURmuNcNS1nUwJzqKWU1x9CPXXfK4xVSK1utcL7`,
      // `--added-borrow-weight-bps 10`,
      // `--reserve-type Regular`,
      // `--protocol-take-rate 80`,
      // `--verbose`,
    ];

    let updateReserveCmd =
      `RUST_BACKTRACE=1 ${currentExeDir}/target/debug/relend-program --program ${program_id} ` +
      `--url ${endpoint} --fee-payer ${pathDir} update-reserve ` +
      updateReserveParam.join(" ");

    exec(updateReserveCmd, { shell: "/bin/bash" }, (error, stdout, stderr) => {
      if (error) {
        console.error(`update-reserve-config-successfully: failed`);
        return;
      } else {
        console.error(`update-reserve-config-successfully: oke`);
      }
    });
  });

  it("update fails with invalid risk authority", async () => {
    const currentExeDir = path.join(__dirname, "..");
    const invalidOwner = "./invalid_owner.json";
    const invalidOwnerPath = path.join(__dirname, invalidOwner);
    let updateReserveParam = [
      `--market-owner ${invalidOwnerPath}`,
      `--market ${lendingMarket.toBase58()}`,
      `--reserve ${reserve.toBase58()}`,
      `--borrow-fee 0.3`,
      // `--borrow-limit 2000000`,
      // `--host-fee-percentage 20`,
      // `--deposit-limit 5000000`,
      // `--pyth-product 8jMh1d8NA84AZErW2uZ71Jbhci3PyV3WaySbVVLXGctt`,
      // `--pyth-price nakiaURmuNcNS1nUwJzqKWU1x9CPXXfK4xVSK1utcL7`,
      // `--switchboard-feed nakiaURmuNcNS1nUwJzqKWU1x9CPXXfK4xVSK1utcL7`,
      // `--added-borrow-weight-bps 10`,
      // `--reserve-type Regular`,
      // `--protocol-take-rate 80`,
      // `--verbose`,
    ];

    let updateReserveCmd =
      `RUST_BACKTRACE=1 ${currentExeDir}/target/debug/relend-program --program ${program_id} ` +
      `--url ${endpoint} --fee-payer ${invalidOwnerPath} update-reserve ` +
      updateReserveParam.join(" ");

    exec(updateReserveCmd, { shell: "/bin/bash" }, (error, stdout, stderr) => {
      if (error) {
        console.error(`update-reserve-config-fails-with-invalid-risk-authority: oke`);
        return;
      } else {
        console.error(`update-reserve-config-fails-with-invalid-risk-authority: failed`);
      }
    });
  });

  it("state does not change with params that are not allowed to update", async () => {
    const currentExeDir = path.join(__dirname, "..");
    let updateReserveParam = [
      `--market-owner ${pathDir}`,
      `--market ${lendingMarket.toBase58()}`,
      `--reserve ${reserve.toBase58()}`,
      `--optimal-utilization-rate 80`,
      `--max-utilization-rate 90`,
      `--loan-to-value-ratio 85`,
      `--liquidation-bonus 10`,
      `--liquidation-threshold 85`,
      `--max-liquidation-bonus 20`,
      `--max-liquidation-threshold 90`,
      `--min-borrow-rate 1 `,
      `--optimal-borrow-rate  7`,
      `--max-borrow-rate 100`,
      `--super-max-borrow-rate 200`,
    ];

    let updateReserveCmd =
      `RUST_BACKTRACE=1 ${currentExeDir}/target/debug/relend-program --program ${program_id} ` +
      `--url ${endpoint} --fee-payer ${pathDir} update-reserve ` +
      updateReserveParam.join(" ");

    exec(updateReserveCmd, { shell: "/bin/bash" }, (error, stdout, stderr) => {
      let viewReserveParam = [
        `--reserve ${reserve.toBase58()}`,
      ];

      if (error) {
        console.log(error);
        console.log("state-does-not-change-with-params-that-are-not-allowed-to-update: failed");
        return;
      }

      let viewReserveCmd =
        `RUST_BACKTRACE=1 ${currentExeDir}/target/debug/relend-program --program ${program_id} ` +
        `--url ${endpoint} view-reserve ` +
        viewReserveParam.join(" ");

      exec(viewReserveCmd, { shell: "/bin/bash" }, (error, stdout, stderr) => {
        if (error) {
          console.log(error);
          console.log("state-does-not-change-with-params-that-are-not-allowed-to-update: failed");
          return;
        }
        let optimalUtilizationRateMatch = stdout.match(/optimal_utilization_rate: (.*?),/);
        let maxUtilizationRateMatch = stdout.match(/max_utilization_rate: (.*?),/);
        let loanToValueRatioMatch = stdout.match(/loan_to_value_ratio: (.*?),/);
        let liquidationBonusMatch = stdout.match(/liquidation_bonus: (.*?),/);
        let maxLiquidationBonusMatch = stdout.match(/max_liquidation_bonus: (.*?),/);
        let liquidationThresholdMatch = stdout.match(/liquidation_threshold: (.*?),/);
        let maxLiquidationThresholdMatch = stdout.match(/max_liquidation_threshold: (.*?),/);
        let minBorrowRateMatch = stdout.match(/min_borrow_rate: (.*?),/);
        let optimalBorrowRateMatch = stdout.match(/optimal_borrow_rate: (.*?),/);
        let maxBorrowRateMatch = stdout.match(/max_borrow_rate: (.*?),/);
        let superMaxBorrowRateMatch = stdout.match(/super_max_borrow_rate: (.*?),/);

        expect(optimalUtilizationRateMatch[1] == "90");
        expect(maxUtilizationRateMatch[1] == "100");
        expect(loanToValueRatioMatch[1] == "95");
        expect(liquidationBonusMatch[1] == "5");
        expect(maxLiquidationBonusMatch[1] == "95");
        expect(liquidationThresholdMatch[1] == "10");
        expect(maxLiquidationThresholdMatch[1] == "100");
        expect(minBorrowRateMatch[1] == "0");
        expect(optimalBorrowRateMatch[1] == "8");
        expect(maxBorrowRateMatch[1] == "200");
        expect(superMaxBorrowRateMatch[1] == "300");

        console.log("state-does-not-change-with-params-that-are-not-allowed-to-update: oke");
      });
    });
  });
});
