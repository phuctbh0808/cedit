#!/usr/bin/env node

const fs = require("fs");
import { Command } from "commander";
import * as anchor from "@project-serum/anchor";
import { exec } from "child_process";
import path from "path";
import {
  PublicKey,
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  sendAndConfirmTransaction,
  Transaction,
  SystemProgram,
} from "@solana/web3.js";
import {
  getOrCreateAssociatedTokenAccount,
  createSyncNativeInstruction,
  NATIVE_MINT,
} from "spl-token";
import { BN } from "bn.js";
import { RelendAction, RelendMarket } from "relend-adapter";
import BigNumber from "bignumber.js";

const program = new Command();

const opts: anchor.web3.ConfirmOptions = {
  commitment: "confirmed",
};

async function getRENECBalance(walletPublicKey: PublicKey, connection: Connection) {
  try {
    // Fetch the balance of the wallet
    const balance = await connection.getBalance(walletPublicKey);
    return balance / LAMPORTS_PER_SOL; // Add return statement
  } catch (error) {
    console.error("Error checking RENEC balance:", error);
    return 0;
  }
}

async function getSPLTokenBalance(tokenAccount: PublicKey, connection: Connection) {
  try {
    // Fetch the token balance of the wallet
    const tokenAccountInfo = await connection.getTokenAccountBalance(tokenAccount);
    return tokenAccountInfo.value.uiAmount ?? 0; // Add return statement
  } catch (error) {
    console.error("Error checking SPL token balance:", error);
    return 0;
  }
}

program
  .command("supply")
  .description("Supply token for seperate reserve")
  .option("--supplier <string>", "")
  .option("--amount <number>", "")
  .option("--token_sympol <string>", "Token symbol: reVND, reUSD")
  .option("--cluster <string>", "")
  .option("--network_url <string>", "")
  .option("--market_addr <string>", "Market address")
  .action(async (params) => {
    let { supplier, amount, token_sympol, cluster, network_url, market_addr } = params;

    let reUSD = new PublicKey("USDbgSB1DPBCEDt15ppgTZZYiQokMHcvkX6JQRfVNJY");
    let reVND = new PublicKey("2kNzm2v6KR5dpzgavS2nssLV9RxogVP6py2S6doJEfuZ");
    if (cluster == "mainnet") {
      reUSD = new PublicKey("4Q89182juiadeFgGw3fupnrwnnDmBhf7e7fHWxnUP3S3");
      reVND = new PublicKey("2kNzm2v6KR5dpzgavS2nssLV9RxogVP6py2S6doJEfuZ");
    }
    let tokenProgramId = reUSD;
    let decimals = 0;
    switch (token_sympol.toUpperCase()) {
      case "REUSD":
        tokenProgramId = reUSD;
        decimals = 9;
        break;
      case "REVND":
        tokenProgramId = reVND;
        decimals = 0;
        break;
      default:
        console.log("Invalid token symbol. We onlly support reUSD and reVND");
        return;
    }
    console.log("Start to supply token for reserve");
    console.log("params:", params);
    amount = parseFloat(amount);
    console.log("Deposit amount: ", amount);
    const connection = new Connection(network_url, opts);
    const sourceKey = JSON.parse(fs.readFileSync(supplier));
    const keypair = Keypair.fromSecretKey(Uint8Array.from(sourceKey));
    let sourceOwner = keypair.publicKey;
    console.log("Check if source owner has enough balance");
    const ata = await getOrCreateAssociatedTokenAccount(
      connection,
      keypair,
      tokenProgramId,
      sourceOwner,
    );

    const balance = await getSPLTokenBalance(ata.address, connection);
    if (balance < amount) {
      console.log(
        `Please fund ${amount} ${token_sympol} to ${sourceOwner.toBase58()}. Current balance: ${balance}`,
      );
      return;
    }

    const depositAmount = new BigNumber(amount).shiftedBy(decimals).toFixed(0);
    console.log("IS_MAINENT ", process.env.NEXT_PUBLIC_IS_MAINNET);
    console.log("Building supply txns...");
    const env = cluster == "mainnet" ? "production" : "testnet";
    const relendAction = await RelendAction.buildDepositTxns(
      connection,
      depositAmount,
      token_sympol,
      keypair.publicKey,
      env,
      new PublicKey(market_addr),
    );
    const sendTransaction = async (txn: Transaction, connection: Connection) => {
      const { blockhash } = await connection.getLatestBlockhash();
      txn.recentBlockhash = blockhash;
      txn.feePayer = keypair.publicKey;
      txn.sign(keypair);
      return connection.sendRawTransaction(txn.serialize());
    };
    console.log("Sending supply txns...");
    const txHash = await relendAction.sendTransactions(sendTransaction);
    console.log("Confirming supply txns...");
    await connection.confirmTransaction(txHash, "finalized");
    console.log("Supply txHash: ", txHash);
    console.log("Fetching supply obligation...");
    const market = await RelendMarket.initialize(connection, env as any);
    const obligation = await market.fetchObligationByWallet(keypair.publicKey);
    console.log(obligation);
  });

program
  .command("withdraw")
  .description("Withdraw collateral from seperate reserve")
  .option("--supplier <string>", "")
  .option("--amount <number>", "")
  .option("--token_sympol <string>", "Token symbol: reUSD, reVND")
  .option("--cluster <string>", "")
  .option("--network_url <string>", "")
  .option("--market_addr <string>", "Market address")
  .action(async (params) => {
    let { supplier, amount, token_sympol, cluster, network_url, market_addr } = params;

    console.log("Start to withdraw collaterals from reserve");
    console.log("params:", params);
    amount = parseFloat(amount);
    let decimals = 0;
    switch (token_sympol.toUpperCase()) {
      case "REUSD":
        decimals = 9;
        break;
      case "REVND":
        decimals = 0;
        break;
      default:
        console.log("Invalid token symbol. We onlly support reUSD and reVND");
        return;
    }
    const connection = new Connection(network_url, opts);
    const sourceKey = JSON.parse(fs.readFileSync(supplier));
    const keypair = Keypair.fromSecretKey(Uint8Array.from(sourceKey));
    const withdrawAmount = new BigNumber(amount).shiftedBy(decimals).toFixed(0);
    console.log("Building withdraw txns...");
    const relendAction = await RelendAction.buildWithdrawTxns(
      connection,
      withdrawAmount,
      token_sympol,
      keypair.publicKey,
      cluster,
      new PublicKey(market_addr),
    );
    const sendTransaction = async (txn: Transaction, connection: Connection) => {
      const { blockhash } = await connection.getLatestBlockhash();
      txn.recentBlockhash = blockhash;
      txn.feePayer = keypair.publicKey;
      txn.sign(keypair);
      return connection.sendRawTransaction(txn.serialize());
    };
    console.log("Sending withdraw txns...");
    const txHash = await relendAction.sendTransactions(sendTransaction);
    console.log("Confirming withdraw txns...");
    await connection.confirmTransaction(txHash, "finalized");
    console.log("Withdraw txHash: ", txHash);
  });

program
  .command("add-reserve")
  .description("Add new reserve")
  .option("--program_id <string>", "")
  .option("--payer <string>", "")
  .option("--market_owner <string>", "")
  .option("--token_sympol <string>", "Token symbol: ReUSD, RENEC, ReBTC, ReETH")
  .option("--amount <number>", "")
  .option("--cluster <string>", "")
  .option("--network_url <string>", "")
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
  .option("--protocol_take_rate <number>", "")
  .action(async (params) => {
    let {
      program_id,
      payer,
      market_owner,
      token_sympol,
      amount,
      cluster,
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

    let reUSD = new PublicKey("USDbgSB1DPBCEDt15ppgTZZYiQokMHcvkX6JQRfVNJY");
    let reBTC = new PublicKey("BTCxWeEcT5sYsys7ncnr2bU1Mzbn1aXXqJDv43X22cDy");
    let reETH = new PublicKey("ETH6nBodGWYQxz5qZ6C94E4DdQuH5iGTSwdhLHgiLzRy");
    let reVND = new PublicKey("2kNzm2v6KR5dpzgavS2nssLV9RxogVP6py2S6doJEfuZ");
    let reNGN = new PublicKey("BfSYryW6Q93iUKE4uNsUtAdxQT9uU4GSVg2si3outLk1");
    if (cluster == "mainnet") {
      reUSD = new PublicKey("4Q89182juiadeFgGw3fupnrwnnDmBhf7e7fHWxnUP3S3");
      reBTC = new PublicKey("GwPQTMg3eMVpDTEE3daZDtGsBtNHBK3X47dbBJvXUzF4");
      reETH = new PublicKey("GwGh3b7iNibT3gpGn6SwZA9xZme7Th4NZmuGVD75jpZL");
    }

    const caseUSD = "reusdmainnet";
    const caseBTC = "rebtcmainnet";
    const caseETH = "reethmainnet";
    const caseRenec = "renecmainnet";
    const caseVND = "revndmainnet";
    const caseNGN = "rengnmainnet";
    const caseUSD_test = "reusdtestnet";
    const caseBTC_test = "rebtctestnet";
    const caseETH_test = "reethtestnet";
    const caseRenec_test = "renectestnet";
    const caseVND_test = "revndtestnet";
    const caseNGN_test = "rengntestnet";
    const tokenCase = token_sympol.toLowerCase() + cluster.toLowerCase();

    let oracleProduct = "";
    let oraclePrice = "";
    switch (tokenCase) {
      case caseBTC:
        oracleProduct = "5Vqgme5Zg8wS9gLd5gzAuqo5JdxC5ynM57XhqcBVzx2H";
        oraclePrice = "F7jKoXmoBGrTvEPj2PaD4XQc835ZQAu2eXWSNAGCzJUu";
        break;
      case caseETH:
        oracleProduct = "5cV9gxkqE7XMova8ivSykei1zZCn9th1KdJpxf3PUJ5M";
        oraclePrice = "8Qia1nicPBG4TwksAVvzXn2GA5iosB3Q51zA121Xk4Bj";
        break;
      case caseRenec:
        oracleProduct = "F6dpHV5GxqqcuJ1gfEU4AADQ5fUFZ1wFPbLcPMF4XPnQ";
        oraclePrice = "GKQkHhzpDqyQ3AKaoo3ADcFjV6oFLv7Xf7Ut4dKyxtHj";
        break;
      case caseUSD:
        oracleProduct = "4Q89182juiadeFgGw3fupnrwnnDmBhf7e7fHWxnUP3S3";
        oraclePrice = "4Q89182juiadeFgGw3fupnrwnnDmBhf7e7fHWxnUP3S3";
        break;
      case caseVND:
        oracleProduct = "B8C5ZttE6M3RhF533xSgXQv6zsKkBwRodBoqdahu85JQ";
        oraclePrice = "Hf2adYGtFBBiraDGU2AzvXaEjmxTPDRH2uuGzdprjmCh";
        break;
      case caseNGN:
        oracleProduct = "EUFxHUm5P5n6vY363sjtQcRG3XNf1qG56Bx2MZigpaQT";
        oraclePrice = "AeySuk5cgEjkJcBxPswnyzi77ctYNbsKkq5q2miEzPRS";
        break;
      case caseNGN_test:
        oracleProduct = "EUFxHUm5P5n6vY363sjtQcRG3XNf1qG56Bx2MZigpaQT";
        oraclePrice = "AeySuk5cgEjkJcBxPswnyzi77ctYNbsKkq5q2miEzPRS";
        break;
      case caseBTC_test:
        oracleProduct = "4kn3JeaXhBbbwKF3kaYubiWHVCxkJdJap6zsm54CS4YQ";
        oraclePrice = "EWMPWwzt5wFWmtsYhEvGxZ8EvEsPp9Fm5rfQBwoXR3Nz";
        break;
      case caseETH_test:
        oracleProduct = "BKcFo4FD6jSjttHdfwPGuBVZWhZXfSCU6KEFJhhTija1";
        oraclePrice = "CeVUAv8Fk7XfyVefBSZvpQZMMdkBanL4k4jLNCCjwrNC";
        break;
      case caseRenec_test:
        oracleProduct = "8jMh1d8NA84AZErW2uZ71Jbhci3PyV3WaySbVVLXGctt";
        oraclePrice = "nakiaURmuNcNS1nUwJzqKWU1x9CPXXfK4xVSK1utcL7";
        break;
      case caseUSD_test:
        oracleProduct = "4Q89182juiadeFgGw3fupnrwnnDmBhf7e7fHWxnUP3S3";
        oraclePrice = "4Q89182juiadeFgGw3fupnrwnnDmBhf7e7fHWxnUP3S3";
        break;
      case caseVND_test:
        oracleProduct = "B8C5ZttE6M3RhF533xSgXQv6zsKkBwRodBoqdahu85JQ";
        oraclePrice = "Hf2adYGtFBBiraDGU2AzvXaEjmxTPDRH2uuGzdprjmCh";
        break;
    }

    console.log("Add new reserve");
    console.log("params:", params);
    amount = parseFloat(amount);
    const connection = new Connection(network_url, opts);
    const sourceKey = JSON.parse(fs.readFileSync(payer));
    const keypair = Keypair.fromSecretKey(Uint8Array.from(sourceKey));
    let sourceOwner = keypair.publicKey;
    let sourceOwnerAta = sourceOwner.toBase58(); // ATA of source owner which is payer
    let tokenProgramId = reUSD;
    switch (token_sympol.toUpperCase()) {
      case "REBTC":
        tokenProgramId = reBTC;
        break;
      case "REETH":
        tokenProgramId = reETH;
        break;
      case "REVND":
        tokenProgramId = reVND;
        break;
      case "RENGN":
        tokenProgramId = reNGN;
        break;``
    }

    if (token_sympol.toUpperCase() != "RENEC") {
      const ata = await getOrCreateAssociatedTokenAccount(
        connection,
        keypair,
        tokenProgramId,
        sourceOwner,
      );

      const balance = await getSPLTokenBalance(ata.address, connection);
      if (balance < amount) {
        console.log(
          `Please fund ${amount} ${token_sympol} to ${sourceOwner.toBase58()}. Current balance: ${balance}`,
        );
        return;
      }

      console.log("source owner address: ", sourceOwnerAta);
      sourceOwnerAta = ata.address.toBase58();
    } else {
      const ata = await getOrCreateAssociatedTokenAccount(
        connection,
        keypair,
        NATIVE_MINT,
        sourceOwner,
      );

      const wbalance = await getSPLTokenBalance(ata.address, connection);
      if (wbalance < amount) {
        const balance = await getRENECBalance(sourceOwner, connection);
        const needAmount = amount - wbalance + 0.01; // 0.01 RENEC for wrapped fee
        if (balance < needAmount) {
          console.log(
            `Please fund ${needAmount} ${token_sympol} to ${sourceOwner.toBase58()}. Current balance: ${balance}`,
          );
          return;
        }

        console.log("Wrap RENEC to rpl token so that it can be used as supply token");

        console.log(
          "Transfer RENEC to associated token account and use SyncNative to update wrapped RENEC balance",
        );
        const transferAmount = BigInt(Math.ceil(LAMPORTS_PER_SOL * needAmount));
        const reTransferTransaction = new Transaction().add(
          SystemProgram.transfer({
            fromPubkey: sourceOwner,
            toPubkey: ata.address,
            lamports: transferAmount,
          }),
          createSyncNativeInstruction(ata.address),
        );

        await sendAndConfirmTransaction(connection, reTransferTransaction, [keypair]);
        console.log("End wrapped");
      }

      sourceOwnerAta = ata.address.toBase58();
    }

    const exeParams = [
      `--fee-payer ${payer}`,
      `--market-owner ${market_owner}`,
      `--source-owner ${payer}`,
      `--market ${market_addr}`,
      `--source ${sourceOwnerAta}`,
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

    const currentExeDir = path.join(__dirname, "..");
    console.log("Execution folder: ", currentExeDir);
    let exeCmd =
      `RUST_BACKTRACE=1 ${currentExeDir}/target/debug/relend-program --program ${program_id} add-reserve ` +
      exeParams.join(" ");
    exec(exeCmd, { shell: "/bin/bash" }, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error: ${error.message}`);
      }
      console.error("stderr: ", stderr);
      console.log("stdout: ", stdout);
    });
  });

  program
  .command("update-reserve")
  .description("update reserve")
  .option("--program_id <string>", "")
  .option("--payer <string>", "")
  .option("--market_owner <string>", "")
  .option("--cluster <string>", "")
  .option("--network_url <string>", "")
  .option("--market_addr <string>", "Market address")
  .option("--reserve_addr <string>", "Reserve address")
  .option("--borrow_fee <number>", "")
  .option("--borrow_limit <number>", "")
  .option("--deposit_limit <number>", "")
  .action(async (params) => {
    let {
      program_id,
      payer,
      market_owner,
      cluster,
      network_url,
      market_addr,
      reserve_addr,
      borrow_fee,
      borrow_limit,
      deposit_limit,
    } = params;

    console.log("Update reserve");
    console.log("params:", params);
    
    let exeParams = [
      `--fee-payer ${payer}`,
      `--market-owner ${market_owner}`,
      `--market ${market_addr}`,
      `--reserve ${reserve_addr}`
    ];
    
    if (borrow_fee != undefined) {
      exeParams.push(`--borrow-fee ${borrow_fee}`);
    }

    if (borrow_limit != undefined) {
      exeParams.push(`--borrow-limit ${borrow_limit}`);
    }

    if (deposit_limit != undefined) {
      exeParams.push(`--deposit-limit ${deposit_limit}`);
    }

    exeParams.push("--verbose");

    const currentExeDir = path.join(__dirname, "..");
    console.log("Execution folder: ", currentExeDir);
    let exeCmd =
      `RUST_BACKTRACE=1 ${currentExeDir}/target/debug/relend-program --program ${program_id} update-reserve ` +
      exeParams.join(" ");
    exec(exeCmd, { shell: "/bin/bash" }, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error: ${error.message}`);
      }
      console.error("stderr: ", stderr);
      console.log("stdout: ", stdout);
    });
  });

program.parse();