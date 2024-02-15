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
  AccountInfo,
  clusterApiUrl,
} from "@solana/web3.js";
import BN from "bn.js";
import web3 from "@solana/web3.js";
import bs58 from "bs58";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  getOrCreateAssociatedTokenAccount,
} from "spl-token";

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
const programId = new PublicKey("B8DbGSZpQroi4qpUV1Cu8jMWzAQUUtY34ESs1ysSUESX");
const program = new anchor.Program(IDL, programId, provider);
const payer = (provider.wallet as anchor.Wallet).payer;
const payerAccount = payer.publicKey;

let configAccount: PublicKey;
let vaultAccount: PublicKey;
let obligationAccount: PublicKey;
const alice: Keypair = anchor.web3.Keypair.fromSecretKey(
  bs58.decode(
    "3Lw6ZYDey5YLK7kDhdJrjuDAFNVQFvjhu5UpDcUnkmJ1DEZdVcgEy53ht5DTdWdTBLRfcywdhmWoJuwQstphLvu4",
  ),
);
const CONFIG_SEED = "supernova";
const OBLIGATION_REWARD_SEED = "tothemoon";
const VAULT_SEED = "onepiece";
const RELENT_MINT = "4JRe6jvgeXCcQwsxQY3StUcwnrCRKrTcWS4pHjtkpWrK";
let vaultBump: number;
let obligationBump: number;
const obligation = new PublicKey("7Tv3jFyW6efL8VVrmqLUkfuA3USpgMdAae9WxFtQHhYF");

let initializeFn = async () => {
  let bump: number;
  [configAccount, bump] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from(CONFIG_SEED), payerAccount.toBuffer()],
    programId,
  );
  [vaultAccount, vaultBump] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from(VAULT_SEED), configAccount.toBuffer()],
    programId,
  );
  const instructions = [
    await program.methods
      .initialize(bump, vaultBump, keypair.publicKey)
      .accounts({
        feePayer: payerAccount,
        authority: payerAccount,
        configAccount,
        vault: vaultAccount,
        systemProgram: SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .instruction(),
  ];

  const tx = new Transaction().add(...instructions);
  tx.recentBlockhash = (await connection.getLatestBlockhash("finalized")).blockhash;
  tx.feePayer = payerAccount;
  const recoverTx = Transaction.from(tx.serialize({ requireAllSignatures: false }));
  recoverTx.sign(payer);

  await connection.sendRawTransaction(recoverTx.serialize());
  await fetchConfigFn();
};

let supplyFn = async () => {
  let bump: number;
  [configAccount, bump] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from(CONFIG_SEED), payerAccount.toBuffer()],
    programId,
  );
  [vaultAccount, vaultBump] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from(VAULT_SEED), configAccount.toBuffer()],
    programId,
  );

  const mint = new PublicKey(RELENT_MINT);
  const vaultAta = await getAssociatedTokenAddress(mint, vaultAccount, true);
  console.log(vaultAta.toBase58());
  const fromAta = await getOrCreateAssociatedTokenAccount(connection, keypair, mint, payerAccount);
  console.log(fromAta.address.toBase58());
  const instructions = [
    await program.methods
      .supply(new BN(800 * 10 ** 9))
      .accounts({
        feePayer: payerAccount,
        authority: payerAccount,
        tokenAccount: fromAta.address,
        vault: vaultAccount,
        vaultTokenAccount: vaultAta,
        mint: mint,
        configAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
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

let registerForEarnFn = async () => {
  let bump: number;
  [configAccount, bump] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from(CONFIG_SEED), payerAccount.toBuffer()],
    programId,
  );
  [obligationAccount, obligationBump] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from(OBLIGATION_REWARD_SEED), obligation.toBuffer()],
    programId,
  );

  const instructions = [
    await program.methods
      .registerForEarn(obligation, alice.publicKey)
      .accounts({
        authority: payerAccount,
        obligationReward: obligationAccount,
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

let refreshRewardFn = async () => {
  let bump: number;
  [configAccount, bump] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from(CONFIG_SEED), payerAccount.toBuffer()],
    programId,
  );
  [obligationAccount, obligationBump] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from(OBLIGATION_REWARD_SEED), obligation.toBuffer()],
    programId,
  );

  const instructions = [
    await program.methods
      .refreshReward(obligation, alice.publicKey, new BN(3), 0)
      .accounts({
        authority: payerAccount,
        obligationReward: obligationAccount,
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
  await fetchObligationRewardsFn();
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
  [obligationAccount, obligationBump] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from(OBLIGATION_REWARD_SEED), obligation.toBuffer()],
    programId,
  );

  const mint = new PublicKey(RELENT_MINT);
  const vaultAta = await getAssociatedTokenAddress(mint, vaultAccount, true);
  const toAta = await getOrCreateAssociatedTokenAccount(connection, alice, mint, alice.publicKey);

  const instructions = [
    await program.methods
      .claimReward(obligation, alice.publicKey)
      .accounts({
        feePayer: alice.publicKey,
        authority: alice.publicKey,
        tokenAccount: toAta.address,
        vault: vaultAccount,
        vaultTokenAccount: vaultAta,
        mint: mint,
        obligationReward: obligationAccount,
        configAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .instruction(),
  ];

  const tx = new Transaction().add(...instructions);
  tx.recentBlockhash = (await connection.getLatestBlockhash("finalized")).blockhash;
  tx.feePayer = alice.publicKey;
  const recoverTx = Transaction.from(tx.serialize({ requireAllSignatures: false }));
  recoverTx.sign(alice);

  let hash = await connection.sendRawTransaction(recoverTx.serialize());
  console.log(hash);
  await fetchObligationRewardsFn();
};

let fetchObligationRewardsFn = async () => {
  [obligationAccount, obligationBump] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from(OBLIGATION_REWARD_SEED), obligation.toBuffer()],
    programId,
  );
  const rewardInfo = await program.account.obligationReward.fetch(obligationAccount);
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

supplyFn()
  .then(() => {
    console.log("Finished successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.log(error);
    process.exit(1);
  });