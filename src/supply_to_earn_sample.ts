import * as anchor from "@project-serum/anchor";
import { Wallet, AnchorProvider } from "@project-serum/anchor";
import { IDL } from "./reearn_program";
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  sendAndConfirmTransaction,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import BN from "bn.js";
import web3 from "@solana/web3.js";
import bs58 from "bs58";
import {
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  getOrCreateAssociatedTokenAccount,
} from "spl-token";

const opts: anchor.web3.ConfirmOptions = {
  preflightCommitment: "processed",
  commitment: "processed",
};

const connection = new web3.Connection("https://api-testnet.renec.foundation:8899/", opts);
const secretByte = [
  138, 69, 35, 236, 129, 222, 223, 227, 139, 111, 112, 111, 233, 163, 29, 250, 190, 168, 125, 161,
  137, 175, 4, 8, 161, 91, 210, 3, 236, 254, 253, 254, 57, 22, 49, 144, 200, 5, 45, 23, 210, 197,
  16, 205, 85, 148, 127, 122, 39, 76, 225, 106, 155, 166, 51, 96, 101, 161, 133, 246, 229, 85, 33,
  84,
];
const secretKey = Uint8Array.from(secretByte);
const keypair = web3.Keypair.fromSecretKey(secretKey);
const wallet = new Wallet(keypair);
const provider = new AnchorProvider(connection, wallet, opts);
const programId = new PublicKey("DNWtXxdTAjjgZckwCq8sXKnoxGFdD5riNZn4q4zTRqD4");
const program = new anchor.Program(IDL, programId, provider);
const payer = (provider.wallet as anchor.Wallet).payer;
const payerAccount = payer.publicKey;
console.log(payerAccount.toBase58());
let configAccount: PublicKey;
let vaultAccount: PublicKey;
let supplyApyAccount: PublicKey;
let reserveAccount: PublicKey;
const user1: Keypair = anchor.web3.Keypair.fromSecretKey(
  bs58.decode(
    "3Lw6ZYDey5YLK7kDhdJrjuDAFNVQFvjhu5UpDcUnkmJ1DEZdVcgEy53ht5DTdWdTBLRfcywdhmWoJuwQstphLvu4",
  ),
);
const CONFIG_SEED = "supernova";
const SUPPLY_REWARD_SEED = "nevergonnaseeyouagain";
const VAULT_SEED = "onepiece";
const RESERVE_SEED = "bersek3r";
const RELEND_MINT = "4JRe6jvgeXCcQwsxQY3StUcwnrCRKrTcWS4pHjtkpWrK";
let vaultBump: number;
let supplyApyBump: number;
let reserveBump: number;
const reserve = new PublicKey("2RbgMCDxwFn5HdrjoW2rJPcj6wStFRRPhguAgLnb9y62");
const obligation = new PublicKey("A8KGMXzdMN9oJLBrcVhCpBy9tCdZGP7MEG6UiyXwbrQV");

let initializeFn = async () => {
  let bump: number;
  [configAccount, bump] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from(CONFIG_SEED), payerAccount.toBuffer()],
    programId,
  );

  [supplyApyAccount, supplyApyBump] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from(SUPPLY_REWARD_SEED), reserve.toBuffer()],
    programId,
  );

  const instructions = [
    await program.methods
      .initReserveReward(reserve, new PublicKey(RELEND_MINT), 2.0, 9)
      .accounts({
        feePayer: payerAccount,
        authority: payerAccount,
        supplyApy: supplyApyAccount,
        configAccount,
        systemProgram: SystemProgram.programId,
      })
      .instruction(),
  ];

  const tx = new Transaction().add(...instructions);
  tx.recentBlockhash = (await connection.getLatestBlockhash("finalized")).blockhash;
  tx.feePayer = payerAccount;
  const recoverTx = Transaction.from(tx.serialize({ requireAllSignatures: false }));
  recoverTx.sign(payer);

  await connection.sendRawTransaction(recoverTx.serialize());
};

let changeSupplyAPY = async () => {
  let bump: number;
  [configAccount, bump] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from(CONFIG_SEED), payerAccount.toBuffer()],
    programId,
  );

  [supplyApyAccount, supplyApyBump] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from(SUPPLY_REWARD_SEED), reserve.toBuffer()],
    programId,
  );

  const instructions = [
    await program.methods
      .changeSupplyApy(new PublicKey(RELEND_MINT), 3.0, 9)
      .accounts({
        authority: payerAccount,
        supplyApy: supplyApyAccount,
        configAccount,
      })
      .instruction(),
  ];

  const tx = new Transaction().add(...instructions);
  tx.recentBlockhash = (await connection.getLatestBlockhash("finalized")).blockhash;
  tx.feePayer = payerAccount;
  const recoverTx = Transaction.from(tx.serialize({ requireAllSignatures: false }));
  recoverTx.sign(payer);

  await connection.sendRawTransaction(recoverTx.serialize());
};

let supplyToEarnFn = async () => {
  let bump: number;
  [configAccount, bump] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from(CONFIG_SEED), payerAccount.toBuffer()],
    programId,
  );
  [reserveAccount, reserveBump] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from(RESERVE_SEED), reserve.toBuffer(), obligation.toBuffer()],
    programId,
  );
  [supplyApyAccount, supplyApyBump] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from(SUPPLY_REWARD_SEED), reserve.toBuffer()],
    programId,
  );

  console.log(reserveAccount.toBase58(), supplyApyAccount.toBase58(), configAccount.toBase58());
  const instructions = [
    await program.methods
      .supplyToEarn(new PublicKey("AX3SRJDbGw4QSpMNyWubTQhUV1sww7qsPAy12K3aHrtb"))
      .accounts({
        authority: payer.publicKey,
        reserveReward: reserveAccount,
        supplyApy: supplyApyAccount,
        configAccount,
        obligation,
        reserve,
        systemProgram: SystemProgram.programId,
      })
      .instruction(),
  ];

  const tx = new Transaction().add(...instructions);
  tx.recentBlockhash = (await connection.getLatestBlockhash("finalized")).blockhash;
  tx.feePayer = payer.publicKey;
  const recoverTx = Transaction.from(tx.serialize({ requireAllSignatures: false }));
  recoverTx.sign(payer);

  await connection.sendRawTransaction(recoverTx.serialize());
};

let claimRewardFn = async () => {
  let bump: number;
  [configAccount, bump] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from(CONFIG_SEED), payerAccount.toBuffer()],
    programId,
  );
  [vaultAccount, vaultBump] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from(VAULT_SEED), configAccount.toBuffer()],
    programId,
  );
  [reserveAccount, reserveBump] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from(RESERVE_SEED), reserve.toBuffer(), obligation.toBuffer()],
    programId,
  );
  [supplyApyAccount, supplyApyBump] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from(SUPPLY_REWARD_SEED), reserve.toBuffer()],
    programId,
  );

  const mint = new PublicKey(RELEND_MINT);
  const vaultAta = await getAssociatedTokenAddress(mint, vaultAccount, true);
  const toAta = await getOrCreateAssociatedTokenAccount(connection, payer, mint, payer.publicKey);

  const instructions = [
    await program.methods
      .claimSteReward(new PublicKey("AX3SRJDbGw4QSpMNyWubTQhUV1sww7qsPAy12K3aHrtb"))
      .accounts({
        authority: payer.publicKey,
        tokenAccount: toAta.address,
        vault: vaultAccount,
        vaultTokenAccount: vaultAta,
        mint,
        obligation,
        reserve,
        reserveReward: reserveAccount,
        supplyApy: supplyApyAccount,
        configAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .instruction(),
  ];

  const tx = new Transaction().add(...instructions);
  tx.recentBlockhash = (await connection.getLatestBlockhash("finalized")).blockhash;
  tx.feePayer = payer.publicKey;
  const recoverTx = Transaction.from(tx.serialize({ requireAllSignatures: false }));
  recoverTx.sign(payer);

  let hash = await connection.sendRawTransaction(recoverTx.serialize());
  console.log(hash);
};

let fetchSupplyAPY = async () => {
  const rewardInfo = await program.account.supplyApy.all();
  console.log(rewardInfo);
};

let fetchConfigFn = async () => {
  let bump: number;
  [configAccount, bump] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from(CONFIG_SEED), payerAccount.toBuffer()],
    programId,
  );
  const configAccountInfo = await program.account.config.fetch(configAccount);
  console.log(configAccountInfo);
};

let fetchReserveRewardFn = async () => {
  console.log(await program.account.reserveReward.all());
}

fetchSupplyAPY()
  .then(() => {
    console.log("Finished successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.log(error);
    process.exit(1);
  });
