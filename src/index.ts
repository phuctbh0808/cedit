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
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  transfer,
} from "spl-token";
import { BN } from "bn.js";
import { RelendAction, RelendMarket } from "relend-adapter";
import BigNumber from "bignumber.js";
import { IDL } from "./reearn_program";
import { delay } from "@renec-foundation/oracle-sdk";

const program = new Command();

const opts: anchor.web3.ConfirmOptions = {
  commitment: "confirmed",
};

const BTE_CONFIG_SEED = "supernova";
const BTE_OBLIGATION_REWARD_SEED = "tothemoon";
const BTE_VAULT_SEED = "onepiece";

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
  .description("Supply token for separate reserve")
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
        console.log("Invalid token symbol. We only support reUSD and reVND");
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
    console.log("IS_MAINNET ", process.env.NEXT_PUBLIC_IS_MAINNET);
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
  .description("Withdraw collateral from separate reserve")
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
        console.log("Invalid token symbol. We only support reUSD and reVND");
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
    let GAST = new PublicKey("GvTwnAQLTdM6fMZbuGQoVj5odefCC2FsDvaMgxqZV1fi");
    let PLUS1 = new PublicKey("AhDXc3sRW1xKPXwDwAmGb4JonRTka5rdSjg43owF53gg");
    let APS = new PublicKey("BQEZ2K6Gj662kdKtaH4RhpuZDrPpxKm5ANFc9e27k2YU");
    let BNB = new PublicKey("7G8x2UZSgVDZzbPSUKGjg2e2YAkMV8zwiP1525yxEK47");
    let SOL = new PublicKey("3r7AzTijvTDoLGgMqcNXTJimwg8XyxUG6EaVqHXF8EWC");
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
    const caseGAST = "gastmainnet";
    const casePLUS1 = "plus1mainnet";
    const caseAPS = "apsmainnet";
    const caseBNB = "bnbmainnet";
    const caseSOL = "solmainnet";
    const caseUSD_test = "reusdtestnet";
    const caseBTC_test = "rebtctestnet";
    const caseETH_test = "reethtestnet";
    const caseRenec_test = "renectestnet";
    const caseVND_test = "revndtestnet";
    const caseNGN_test = "rengntestnet";
    const caseGAST_test = "gasttestnet";
    const casePLUS1_test = "plus1testnet";
    const caseAPS_test = "apstestnet";
    const caseBNB_test = "bnbtestnet";
    const caseSOL_test = "soltestnet";
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
      case caseGAST:
        oracleProduct = "45uxAij4yzKyyBebFLzHD1aCqfXaUYuENJsJ8d2R8bHK";
        oraclePrice = "9xfsZyNnsiLR7GUf6qSyscTSSNgPoUAvUrwVHPnXkATh";
        break;
      case casePLUS1:
        oracleProduct = "6sC5hhhhiVRuLZRAhWjHWdV4QHquSj6JpEZxZejqPz7Q";
        oraclePrice = "DyvCq8sSXJkbTaU2oXEB7PNwVaCuNbkz3CvmnKsigWHB";
        break;
      case caseAPS:
        oracleProduct = "4gHMEuD2eg69QA8EKwdNAcnJB7WHZMhh84vhDWZ6o988";
        oraclePrice = "9a6StiPXw1KC2pZ1qEavN6nobCSe2wkMQwaUniHsk9aL";
        break;
      case caseBNB:
        oracleProduct = "EdNEs5aVomEduCQpVFgXQjLMpb34tazX5UuSZgW6kuYB";
        oraclePrice = "8KFnEVkcAtvzb7Z5YVRmPBqPrq2syKJM4EoW4xnjw4Qu";
        break;
      case caseSOL:
        oracleProduct = "7Mf32AtCbCwny2bXqU2heFjoq2RjiLChnzBPGWbuGnLV";
        oraclePrice = "32uDe1yQ26xG1acoscYU15Gdpio6toEa2HumJ4Ehsrv1";
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
      case caseGAST_test:
        oracleProduct = "45uxAij4yzKyyBebFLzHD1aCqfXaUYuENJsJ8d2R8bHK";
        oraclePrice = "9xfsZyNnsiLR7GUf6qSyscTSSNgPoUAvUrwVHPnXkATh";
        break;
      case casePLUS1_test:
        oracleProduct = "6sC5hhhhiVRuLZRAhWjHWdV4QHquSj6JpEZxZejqPz7Q";
        oraclePrice = "DyvCq8sSXJkbTaU2oXEB7PNwVaCuNbkz3CvmnKsigWHB";
        break;
      case caseAPS_test:
        oracleProduct = "4gHMEuD2eg69QA8EKwdNAcnJB7WHZMhh84vhDWZ6o988";
        oraclePrice = "9a6StiPXw1KC2pZ1qEavN6nobCSe2wkMQwaUniHsk9aL";
        break;
      case caseBNB_test:
        oracleProduct = "EdNEs5aVomEduCQpVFgXQjLMpb34tazX5UuSZgW6kuYB";
        oraclePrice = "8KFnEVkcAtvzb7Z5YVRmPBqPrq2syKJM4EoW4xnjw4Qu";
        break;
      case caseSOL_test:
        oracleProduct = "7Mf32AtCbCwny2bXqU2heFjoq2RjiLChnzBPGWbuGnLV";
        oraclePrice = "32uDe1yQ26xG1acoscYU15Gdpio6toEa2HumJ4Ehsrv1";
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
        break;
      case "GAST":
        tokenProgramId = GAST;
        break;
      case "PLUS1":
        tokenProgramId = PLUS1;
        break;
      case "APS":
        tokenProgramId = APS;
        break;
      case "BNB":
        tokenProgramId = BNB;
        break;
      case "SOL":
        tokenProgramId = SOL;
        break;
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
  .option("--market_addr <string>", "Market address")
  .option("--reserve_addr <string>", "Reserve address")
  .option("--borrow_fee <number>", "")
  .option("--borrow_limit <number>", "")
  .option("--deposit_limit <number>", "")
  .option("--optimal_utilization_rate <number>", "")
  .option("--max_utilization_rate <number>", "")
  .option("--min_borrow_rate <number>", "")
  .option("--optimal_borrow_rate <number>", "")
  .option("--max_borrow_rate <number>", "")
  .option("--super_max_borrow_rate <number>", "")
  .option("--added_borrow_weight_bps <number>", "")
  .option("--protocol_take_rate <number>", "")
  .action(async (params) => {
    let {
      program_id,
      payer,
      market_owner,
      market_addr,
      reserve_addr,
      borrow_fee,
      borrow_limit,
      deposit_limit,
      optimal_utilization_rate,
      max_utilization_rate,
      min_borrow_rate,
      optimal_borrow_rate,
      max_borrow_rate,
      super_max_borrow_rate,
      added_borrow_weight_bps,
      protocol_take_rate,
    } = params;

    console.log("Update reserve");
    console.log("params:", params);

    let exeParams = [
      `--fee-payer ${payer}`,
      `--market-owner ${market_owner}`,
      `--market ${market_addr}`,
      `--reserve ${reserve_addr}`,
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

    if (optimal_utilization_rate != undefined) {
      exeParams.push(`--optimal-utilization-rate ${optimal_utilization_rate}`);
    }

    if (max_utilization_rate != undefined) {
      exeParams.push(`--max-utilization-rate ${max_utilization_rate}`);
    }

    if (min_borrow_rate != undefined) {
      exeParams.push(`--min-borrow-rate ${min_borrow_rate}`);
    }

    if (optimal_borrow_rate != undefined) {
      exeParams.push(`--optimal-borrow-rate ${optimal_borrow_rate}`);
    }

    if (max_borrow_rate != undefined) {
      exeParams.push(`--max-borrow-rate ${max_borrow_rate}`);
    }

    if (super_max_borrow_rate != undefined) {
      exeParams.push(`--super-max-borrow-rate ${super_max_borrow_rate}`);
    }

    if (added_borrow_weight_bps != undefined) {
      exeParams.push(`--added-borrow-weight-bps ${added_borrow_weight_bps}`);
    }

    if (protocol_take_rate != undefined) {
      exeParams.push(`--protocol-take-rate ${protocol_take_rate}`);
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

program
  .command("set-lending-market-risk-authority")
  .description("Set lending market risk authority")
  .option("--program_id <string>", "")
  .option("--payer <string>", "")
  .option("--market_owner <string>", "Owner of the lending market")
  .option("--market <string>", "Lending market address")
  .option("--risk_authority <string>", "Risk authority address")
  .action(async (params) => {
    let { program_id, payer, market_owner, market, risk_authority } = params;

    console.log("Set lending market risk authority");
    console.log("params:", params);

    if (
      !PublicKey.isOnCurve(new PublicKey(risk_authority).toBase58()) ||
      !PublicKey.isOnCurve(risk_authority)
    ) {
      console.error("Invalid risk authority address");
      return;
    }

    const currentExeDir = path.join(__dirname, "..");
    console.log("Execution folder: ", currentExeDir);
    // Check if risk authority is already set
    // Get current market info
    let viewMarketExecParams = [`--market ${market}`];
    let viewMarketExecCmd =
      `RUST_BACKTRACE=1 ${currentExeDir}/target/debug/relend-program --program ${program_id} view-market ` +
      viewMarketExecParams.join(" ");
    exec(viewMarketExecCmd, { shell: "/bin/bash" }, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error: ${error.message}`);
        return;
      }
      // Get risk authority from stdout, the stdout format is like:
      // ```
      //    ...
      //       whitelisted_liquidator: None,
      //       risk_authority: AjunQwCmBcbB7XxvieLToVdWBxbK5vBDFp93ctBdfZve,
      //     },
      //   )
      // ```
      // Using regex to get risk authority, get the substring between "risk_authority: " and
      // the first "," after it.
      let match = stdout.match(/risk_authority: (.*?),/);
      if (match && match[1]) {
        let resultString = match[1];
        if (resultString == risk_authority) {
          console.log("Risk authority is already set to ", risk_authority);
          return;
        }
      } else {
        console.log("Failed to get risk authority from lending market");
      }
    });

    let exeParams = [
      `--fee-payer ${payer}`,
      `--market-owner ${market_owner}`,
      `--market ${market}`,
      `--risk-authority ${risk_authority}`,
    ];

    exeParams.push("--verbose");

    let exeCmd =
      `RUST_BACKTRACE=1 ${currentExeDir}/target/debug/relend-program --program ${program_id} set-lending-market-risk-authority ` +
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
  .command("init-reearn-pool")
  .description("Init reearn pool")
  .option("--program_id <string>", "")
  .option("--authority <string>", "")
  .option("--network_url <string>", "")
  .action(async (params) => {
    let { program_id, authority, network_url } = params;

    console.log("Init reearn pool");
    console.log("params:", params);
    const connection = new Connection(network_url, opts);
    const sourceKey = JSON.parse(fs.readFileSync(authority));
    const keypair = Keypair.fromSecretKey(Uint8Array.from(sourceKey));
    const wallet = new anchor.Wallet(keypair);
    const provider = new anchor.AnchorProvider(connection, wallet, opts);
    const programId = new PublicKey(program_id);
    const program = new anchor.Program(IDL, programId, provider);
    let owner = keypair.publicKey;

    let bump: number;
    let configAccount: PublicKey;
    let vaultAccount: PublicKey;
    let vaultBump: number;
    [configAccount, bump] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from(BTE_CONFIG_SEED), owner.toBuffer()],
      programId,
    );
    [vaultAccount, vaultBump] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from(BTE_VAULT_SEED), configAccount.toBuffer()],
      programId,
    );

    const instructions = [
      await program.methods
        .initialize(bump, vaultBump, keypair.publicKey)
        .accounts({
          feePayer: owner,
          authority: owner,
          configAccount,
          vault: vaultAccount,
          systemProgram: SystemProgram.programId,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        })
        .instruction(),
    ];

    console.log("Initialzing reearn pool");
    const tx = new Transaction().add(...instructions);
    tx.recentBlockhash = (await connection.getLatestBlockhash("finalized")).blockhash;
    tx.feePayer = owner;
    const recoverTx = Transaction.from(tx.serialize({ requireAllSignatures: false }));
    recoverTx.sign(keypair);

    console.log("Init successfully, retrieving config account info");
    await connection.sendRawTransaction(recoverTx.serialize());
    [configAccount, bump] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from(BTE_CONFIG_SEED), owner.toBuffer()],
      programId,
    );
    const configAccountInfo = await program.account.config.fetch(configAccount);
    console.log(configAccountInfo);
  });

program
  .command("supply-reearn-pool")
  .option("--program_id <string>", "")
  .option("--source <string>", "")
  .option("--network_url <string>", "")
  .option("--cluster <string>", "")
  .option("--amount <number>", "")
  .description("Supply token for reearn pool")
  .action(async (params) => {
    let { program_id, source, network_url, cluster, amount } = params;

    console.log("Supply reearn pool");
    console.log("params:", params);
    const connection = new Connection(network_url, opts);
    const sourceKey = JSON.parse(fs.readFileSync(source));
    const keypair = Keypair.fromSecretKey(Uint8Array.from(sourceKey));
    const wallet = new anchor.Wallet(keypair);
    const provider = new anchor.AnchorProvider(connection, wallet, opts);
    const programId = new PublicKey(program_id);
    const program = new anchor.Program(IDL, programId, provider);
    let sourceOwner = keypair.publicKey;
    let relendTokenMint = new PublicKey("Gt9oqTVmAwhrjBpS5j4Nc39fr9gCYArWxVXuHHc8QxnJ");
    if (cluster == "testnet") {
      relendTokenMint = new PublicKey("4JRe6jvgeXCcQwsxQY3StUcwnrCRKrTcWS4pHjtkpWrK");
    }

    console.log("Check if source owner has enough balance");
    const ata = await getOrCreateAssociatedTokenAccount(
      connection,
      keypair,
      relendTokenMint,
      sourceOwner,
    );

    const balance = await getSPLTokenBalance(ata.address, connection);
    if (balance < amount) {
      console.log(
        `Please fund ${amount} RELEND to ${sourceOwner.toBase58()}. Current balance: ${balance}`,
      );
      return;
    }

    console.log("Source owner address: ", sourceOwner.toBase58());

    let bump: number;
    let configAccount: PublicKey;
    let vaultAccount: PublicKey;
    let vaultBump: number;
    [configAccount, bump] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from(BTE_CONFIG_SEED), sourceOwner.toBuffer()],
      programId,
    );
    [vaultAccount, vaultBump] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from(BTE_VAULT_SEED), configAccount.toBuffer()],
      programId,
    );

    const vaultAta = await getAssociatedTokenAddress(relendTokenMint, vaultAccount, true);
    console.log("vault ATA: ", vaultAta.toBase58());
    const fromAta = ata;
    console.log("source ATA: ", fromAta.address.toBase58());
    const instructions = [
      await program.methods
        .supply(new BN(amount * 10 ** 9))
        .accounts({
          feePayer: sourceOwner,
          authority: sourceOwner,
          tokenAccount: fromAta.address,
          vault: vaultAccount,
          vaultTokenAccount: vaultAta,
          mint: relendTokenMint,
          configAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        })
        .instruction(),
    ];

    console.log("Supplying reearn pool");
    const tx = new Transaction().add(...instructions);
    tx.recentBlockhash = (await connection.getLatestBlockhash("finalized")).blockhash;
    tx.feePayer = sourceOwner;
    const recoverTx = Transaction.from(tx.serialize({ requireAllSignatures: false }));
    recoverTx.sign(keypair);

    await connection.sendRawTransaction(recoverTx.serialize());
    console.log("Supply successfully!");
  });

program
  .command("set-reearn-operator")
  .option("--program_id <string>", "")
  .option("--authority <string>", "")
  .option("--network_url <string>", "")
  .option("--operator <string>", "")
  .description("Set reearn operator")
  .action(async (params) => {
    let { program_id, authority, network_url, operator } = params;

    console.log("Set reearn operator");
    console.log("params:", params);
    const connection = new Connection(network_url, opts);
    const sourceKey = JSON.parse(fs.readFileSync(authority));
    const keypair = Keypair.fromSecretKey(Uint8Array.from(sourceKey));
    const wallet = new anchor.Wallet(keypair);
    const provider = new anchor.AnchorProvider(connection, wallet, opts);
    const programId = new PublicKey(program_id);
    const program = new anchor.Program(IDL, programId, provider);
    let sourceOwner = keypair.publicKey;

    let bump: number;
    let configAccount: PublicKey;

    [configAccount, bump] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from(BTE_CONFIG_SEED), sourceOwner.toBuffer()],
      programId,
    );

    const instructions = [
      await program.methods
        .changeOperator(new PublicKey(operator))
        .accounts({
          authority: sourceOwner,
          configAccount,
        })
        .instruction(),
    ];

    console.log("Setting reearn operator");
    const tx = new Transaction().add(...instructions);
    tx.recentBlockhash = (await connection.getLatestBlockhash("finalized")).blockhash;
    tx.feePayer = sourceOwner;
    const recoverTx = Transaction.from(tx.serialize({ requireAllSignatures: false }));
    recoverTx.sign(keypair);

    console.log("Change operator successfully, retrieving config account info");
    await connection.sendRawTransaction(recoverTx.serialize());
    const configAccountInfo = await program.account.config.fetch(configAccount);
    console.log(configAccountInfo);
  });

program
  .command("enable-supply-gauge")
  .option("--program_id <string>", "Pubkey")
  .option("--source <string>", "wallet keypair")
  .option("--network_url <string>", "")
  .option("--admin_key <string>", "Pubkey")
  .option("--reserve <string>", "Pubkey")
  .option("--reward <string>", "Pubkey")
  .option("--reward_decimals <number>", "")
  .option("--apy <number>", "ration decimal number")
  .option("--start_time <string>", "Start time reward, UTC time: dd/MM/yyyy hh:mm")
  .option("--end_time <string>", "End time reward, UTC time: dd/MM/yyyy hh:mm")
  .description("Enable gauge for supply reserve")
  .action(async (params) => {
    let { program_id, source, network_url, admin_key, reserve, reward, reward_decimals, apy, start_time, end_time } =
      params;

    console.log("Enable supply gauge");
    console.log("params:", params);

    if (
      !PublicKey.isOnCurve(new PublicKey(reserve).toBase58()) ||
      !PublicKey.isOnCurve(reserve) ||
      !PublicKey.isOnCurve(reward) ||
      !PublicKey.isOnCurve(new PublicKey(reward).toBase58())
    ) {
      console.error("Invalid pubkey address for reserve or reward");
      return;
    }

    const startTimeUnix = convertDateStringToUnixTimeSecond(start_time);
    const endTimeUnix = convertDateStringToUnixTimeSecond(end_time);
    const connection = new Connection(network_url, opts);
    const sourceKey = JSON.parse(fs.readFileSync(source));
    const keypair = Keypair.fromSecretKey(Uint8Array.from(sourceKey));
    const wallet = new anchor.Wallet(keypair);
    const provider = new anchor.AnchorProvider(connection, wallet, opts);
    const programId = new PublicKey(program_id);
    const program = new anchor.Program(IDL, programId, provider);
    let sourceOwner = keypair.publicKey;
    let configAccount: PublicKey;
    let supplyApyAccount: PublicKey;
    let vaultAccount: PublicKey;
    let bump: number;
    let supplyApyBump: number;
    const VAULT_SEED = "onepiece";
    const CONFIG_SEED = "supernova";
    const SUPPLY_REWARD_SEED = "nevergonnaseeyouagain";
    const reserveKey = new PublicKey(reserve);
    [configAccount, bump] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from(CONFIG_SEED), new PublicKey(admin_key).toBuffer()],
      programId,
    );

    [supplyApyAccount, supplyApyBump] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from(SUPPLY_REWARD_SEED), reserveKey.toBuffer()],
      programId,
    );

    await program.account.supplyApy
      .fetch(supplyApyAccount)
      .then(async () => {
        console.log("Supply apy account found, updating it");
        const instructions = [
          await program.methods
            .changeSupplyApy(new PublicKey(reward), apy, reward_decimals, new BN(startTimeUnix), new BN(endTimeUnix))
            .accounts({
              authority: sourceOwner,
              supplyApy: supplyApyAccount,
              configAccount,
            })
            .instruction(),
        ];

        const tx = new Transaction().add(...instructions);
        tx.recentBlockhash = (await connection.getLatestBlockhash("finalized")).blockhash;
        tx.feePayer = sourceOwner;
        const recoverTx = Transaction.from(tx.serialize({ requireAllSignatures: false }));
        recoverTx.sign(keypair);

        await connection.sendRawTransaction(recoverTx.serialize());
      })
      .catch(async () => {
        console.log("Supply apy account not found, creating new one");
        const instructions = [
          await program.methods
            .initReserveReward(reserveKey, new PublicKey(reward), apy, reward_decimals, new BN(startTimeUnix), new BN(endTimeUnix))
            .accounts({
              feePayer: sourceOwner,
              authority: sourceOwner,
              supplyApy: supplyApyAccount,
              configAccount,
              systemProgram: SystemProgram.programId,
            })
            .instruction(),
        ];

        const tx = new Transaction().add(...instructions);
        tx.recentBlockhash = (await connection.getLatestBlockhash("finalized")).blockhash;
        tx.feePayer = sourceOwner;
        const recoverTx = Transaction.from(tx.serialize({ requireAllSignatures: false }));
        recoverTx.sign(keypair);

        await connection.sendRawTransaction(recoverTx.serialize());
      });

    console.log("Reearn supply vault \n");
    let vaultBump: number;
    [vaultAccount, vaultBump] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from(VAULT_SEED), configAccount.toBuffer()],
      programId,
    );
    console.log(vaultAccount.toBase58());

    await delay(5000);
    const supplyApyData = await program.account.supplyApy.fetch(supplyApyAccount);
    console.log("Supply apy data: ", supplyApyData);
  });

program
  .command("close-supply-gauge")
  .option("--program_id <string>", "Pubkey")
  .option("--source <string>", "wallet keypair")
  .option("--network_url <string>", "")
  .option("--admin_key <string>", "Pubkey")
  .option("--reserve <string>", "Pubkey")
  .description("Close gauge for supply reserve")
  .action(async (params) => {
    let { program_id, source, network_url, admin_key, reserve  } =
      params;

    console.log("Close supply gauge");
    console.log("params:", params);

    if (
      !PublicKey.isOnCurve(new PublicKey(reserve).toBase58()) ||
      !PublicKey.isOnCurve(reserve)
    ) {
      console.error("Invalid pubkey address for reserve");
      return;
    }

    const connection = new Connection(network_url, opts);
    const sourceKey = JSON.parse(fs.readFileSync(source));
    const keypair = Keypair.fromSecretKey(Uint8Array.from(sourceKey));
    const wallet = new anchor.Wallet(keypair);
    const provider = new anchor.AnchorProvider(connection, wallet, opts);
    const programId = new PublicKey(program_id);
    const program = new anchor.Program(IDL, programId, provider);
    let sourceOwner = keypair.publicKey;
    let configAccount: PublicKey;
    let supplyApyAccount: PublicKey;
    let bump: number;
    let supplyApyBump: number;
    const CONFIG_SEED = "supernova";
    const SUPPLY_REWARD_SEED = "nevergonnaseeyouagain";
    const reserveKey = new PublicKey(reserve);
    [configAccount, bump] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from(CONFIG_SEED), new PublicKey(admin_key).toBuffer()],
      programId,
    );

    [supplyApyAccount, supplyApyBump] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from(SUPPLY_REWARD_SEED), reserveKey.toBuffer()],
      programId,
    );
    const instructions = [
        await program.methods
        .closeReserveReward(reserveKey)
        .accounts({
          feePayer: sourceOwner,  
          authority: sourceOwner,
          supplyApy: supplyApyAccount,
          configAccount,
          systemProgram: SystemProgram.programId,
        })
        .instruction(),
    ];

    const tx = new Transaction().add(...instructions);
    tx.recentBlockhash = (await connection.getLatestBlockhash("finalized")).blockhash;
    tx.feePayer = sourceOwner;
    const recoverTx = Transaction.from(tx.serialize({ requireAllSignatures: false }));
    recoverTx.sign(keypair);

    const txHash = await connection.sendRawTransaction(recoverTx.serialize());

    console.log("Close reserve account success at tx", txHash);
  });

program
  .command("fetch-reearn-config")
  .option("--program_id <string>", "")
  .option("--source <string>", "")
  .option("--network_url <string>", "")
  .description("Fetch reearn config")
  .action(async (params) => {
    let { program_id, source, network_url } = params;

    console.log("Ferch reearn config");
    console.log("params:", params);
    const connection = new Connection(network_url, opts);
    const sourceKey = JSON.parse(fs.readFileSync(source));
    const keypair = Keypair.fromSecretKey(Uint8Array.from(sourceKey));
    const wallet = new anchor.Wallet(keypair);
    const provider = new anchor.AnchorProvider(connection, wallet, opts);
    const programId = new PublicKey(program_id);
    const program = new anchor.Program(IDL, programId, provider);

    console.log("Reearn admin configuration \n");
    const configAccountInfo = await program.account.config.all();
    console.log(configAccountInfo);

    console.log("Reearn supply gauge configuration \n");
    const rewardInfo = await program.account.supplyApy.all();
    console.log(rewardInfo);
  });

program.parse();

function convertDateStringToUnixTimeSecond(dateString: string) {
  // date string format: DD/mm/YYYY hh:mm, for example: 01/01/2022 00:00, time will be in UTC
  const [datePart, timePart] = dateString.split(' ');
  const [day, month, year] = datePart.split('/');
  const [hours, minutes] = timePart.split(':');
  const formattedDate = `${month}/${day}/${year} ${hours}:${minutes} UTC`;
  const dateObject = new Date(formattedDate);

  if (isNaN(dateObject.getTime())) {
      throw new Error('Invalid date');
  }
  console.log("Date object ", dateObject);
  const unixTimestamp = Math.floor(dateObject.getTime() / 1000);
  return unixTimestamp;
}
