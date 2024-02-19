import { AnchorProvider, Wallet, web3 } from "@project-serum/anchor";
import * as anchor from "@project-serum/anchor";
import { IDL } from "./types/reearn_program";
import { PublicKey, Keypair } from "@solana/web3.js";
import bs58 from "bs58";

export const opts: anchor.web3.ConfirmOptions = {
  preflightCommitment: "processed",
  commitment: "processed",
};
export const connection = new web3.Connection("https://api-testnet.renec.foundation:8899/", opts);
export const secretByte = [
  138, 69, 35, 236, 129, 222, 223, 227, 139, 111, 112, 111, 233, 163, 29, 250, 190, 168, 125, 161,
  137, 175, 4, 8, 161, 91, 210, 3, 236, 254, 253, 254, 57, 22, 49, 144, 200, 5, 45, 23, 210, 197,
  16, 205, 85, 148, 127, 122, 39, 76, 225, 106, 155, 166, 51, 96, 101, 161, 133, 246, 229, 85, 33,
  84,
];
export const secretKey = Uint8Array.from(secretByte);
export const keypair = web3.Keypair.fromSecretKey(secretKey);
export const wallet = new Wallet(keypair);
export const provider = new AnchorProvider(connection, wallet, opts);
export const programId = new PublicKey("3PLoeNAqCbGQWMQRm9fFMb2kfwaSQbrLnn613gFFQswT");
export const program = new anchor.Program(IDL, programId, provider);
export const payer = (provider.wallet as anchor.Wallet).payer;
export const payerAccount = payer.publicKey;

export const CONFIG_SEED = "supernova";
export const SUPPLY_REWARD_SEED = "nevergonnaseeyouagain";
export const VAULT_SEED = "onepiece";
export const RESERVE_SEED = "bersek3r";
export const RELEND_MINT = new PublicKey("4JRe6jvgeXCcQwsxQY3StUcwnrCRKrTcWS4pHjtkpWrK");
export const reserve = new PublicKey("2RbgMCDxwFn5HdrjoW2rJPcj6wStFRRPhguAgLnb9y62");
export const obligation = new PublicKey("A8KGMXzdMN9oJLBrcVhCpBy9tCdZGP7MEG6UiyXwbrQV");
export const user1: Keypair = anchor.web3.Keypair.fromSecretKey(
    bs58.decode(
      "3Lw6ZYDey5YLK7kDhdJrjuDAFNVQFvjhu5UpDcUnkmJ1DEZdVcgEy53ht5DTdWdTBLRfcywdhmWoJuwQstphLvu4",
    ),
  );