#!/usr/bin/env node

const fs = require("fs");
import { Command } from "commander";
import * as anchor from "@project-serum/anchor";
import { exec } from "child_process";
import { PublicKey, Connection, Keypair } from "@solana/web3.js";
import { getOrCreateAssociatedTokenAccount } from "spl-token";

const program = new Command();

const __path = process.cwd();
const ownerKey = JSON.parse(fs.readFileSync(__path + "/.wallets/owner.json"));
const reUSD = new PublicKey("4Q89182juiadeFgGw3fupnrwnnDmBhf7e7fHWxnUP3S3");
const reBTC = new PublicKey("GwPQTMg3eMVpDTEE3daZDtGsBtNHBK3X47dbBJvXUzF4");
const reETH = new PublicKey("GwGh3b7iNibT3gpGn6SwZA9xZme7Th4NZmuGVD75jpZL");
const opts: anchor.web3.ConfirmOptions = {
  commitment: "confirmed",
};

program
  .command("add-reserve")
  .description("Add new reserve")
  .option("--program-id <string>", "")
  .option("--owner <string>", "")
  .option("--market-owner <string>", "")
  .option("--token_sympol <string>", "Token symbol: ReUSD, RENEC, ReBTC, ReETH")
  .option("--amount <number>", "")
  .option("--network-url <string>", "")
  .option("--market_addr <string>", "Market address")
  .option("--optimal_utilization_rate <number>", "")
  .option("--max_utilization_rate <number>", "")
  .option("--loan_to_value_ratio <number>", "")
  .option("--liquidation_bonus <number>", "")
  .option("--max_liquidation_bonus <number>", "")
  .option("--max_liquidation_threshold <number>", "")
  .option("--liquidation_threshold <number>", "")
  .option("--min_borrow_rate <number>", "")
  .option("--optimal_borrow_rate <number>", "")
  .option("--max_borrow_rate <number>", "")
  .option("--super_max_borrow_rate <number>", "")
  .option("--borrow_fee <number>", "")
  .option("--borrow_limit <number>", "")
  .option("--host_fee_percentage <number>", "")
  .option("--deposit_limit <number>", "")
  .option("--added_borrow_weight_bps <number>", "")
  .option("--protocol_take_rate")
  .action(async (params) => {
    let {
      program_id,
      owner,
      market_owner,
      token_sympol,
      amount,
      network_url,
      market_addr,
      optimal_utilization_rate,
      max_utilization_rate,
      loan_to_value_ratio,
      liquidation_bonus,
      max_liquidation_bonus,
      max_liquidation_threshold,
      liquidation_threshold,
      min_borrow_rate,
      optimal_borrow_rate,
      max_borrow_rate,
      super_max_borrow_rate,
      borrow_fee,
      borrow_limit,
      host_fee_percentage,
      deposit_limit,
      added_borrow_weight_bps,
      protocol_take_rate,
    } = params;

    console.log("Add new reserve");
    console.log("params:", params);
    const connection = new Connection(network_url, opts);
    const keypair = Keypair.fromSecretKey(ownerKey);
    let tokenAccount = owner;
    let tokenProgramId = reUSD;
    switch (token_sympol.toUpperCase()) {
      case "ReBTC":
        tokenProgramId = reBTC;
        break;
      case "ReETH":
        tokenProgramId = reETH;
        break;
    }

    if (token_sympol.toUpperCase() != "RENEC") {
      tokenAccount = (
        await getOrCreateAssociatedTokenAccount(connection, keypair, tokenProgramId, owner)
      ).address.toBase58();
    }

    let oracleProduct = "";
    let oraclePrice = "";
    switch (token_sympol.toUpperCase()) {
      case "ReBTC":
        oracleProduct = "4kn3JeaXhBbbwKF3kaYubiWHVCxkJdJap6zsm54CS4YQ";
        oraclePrice = "EWMPWwzt5wFWmtsYhEvGxZ8EvEsPp9Fm5rfQBwoXR3Nz";
        break;
      case "ReETH":
        oracleProduct = "BKcFo4FD6jSjttHdfwPGuBVZWhZXfSCU6KEFJhhTija1";
        oraclePrice = "CeVUAv8Fk7XfyVefBSZvpQZMMdkBanL4k4jLNCCjwrNC";
        break;
      case "RENEC":
        oracleProduct = "8jMh1d8NA84AZErW2uZ71Jbhci3PyV3WaySbVVLXGctt";
        oraclePrice = "nakiaURmuNcNS1nUwJzqKWU1x9CPXXfK4xVSK1utcL7";
        break;
      case "ReUSD":
        oracleProduct = "4Q89182juiadeFgGw3fupnrwnnDmBhf7e7fHWxnUP3S3";
        oraclePrice = "4Q89182juiadeFgGw3fupnrwnnDmBhf7e7fHWxnUP3S3";
        break;
    }

    const exeParams = [
      `--program ${program_id}`,
      `--market-owner ${market_owner}`,
      `--source-owner ${ownerKey}`,
      `--market ${market_addr}`,
      `--source ${tokenAccount}`,
      `--amount ${amount}`,
      `--pyth-product ${oracleProduct}`,
      `--pyth-price ${oraclePrice}`,
      `--switchboard-feed ${oracleProduct}`,
      `--optimal-utilization-rate ${optimal_utilization_rate}`,
      `--max-utilization-rate ${max_utilization_rate}`,
      `--loan-to-value-ratio ${loan_to_value_ratio}`,
      `--liquidation-bonus ${liquidation_bonus}`,
      `--max-liquidation-bonus ${max_liquidation_bonus}`,
      `--max-liquidation-threshold ${max_liquidation_threshold}`,
      `--liquidation-threshold ${liquidation_threshold}`,
      `--min-borrow-rate ${min_borrow_rate}`,
      `--optimal-borrow-rate ${optimal_borrow_rate}`,
      `--max-borrow-rate ${max_borrow_rate}`,
      `--super-max-borrow-rate ${super_max_borrow_rate}`,
      `--borrow-fee ${borrow_fee}`,
      `--borrow-limit ${borrow_limit}`,
      `--host-fee-percentage ${host_fee_percentage}`,
      `--deposit-limit ${deposit_limit}`,
      `--added-borrow-weight-bps ${added_borrow_weight_bps}`,
      `--protocol-take-rate ${protocol_take_rate}`,
      "--reserve-type Regular",
      "--verbose",
    ];

    let exeCmd = `target/debug/relend-program add-reserve ` + exeParams.join(" ");
    exec(exeCmd, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error: ${error.message}`);
        return;
      }
      if (stderr) {
        console.error(stderr);
        return;
      }
      console.log(stdout);
    });
  });

program.parse();
