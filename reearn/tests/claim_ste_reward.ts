import * as anchor from "@project-serum/anchor";
import {
  CONFIG_SEED,
  RELEND_MINT,
  SUPPLY_REWARD_SEED,
  connection,
  payerAccount as operatorAccount,
  payer as operator,
  program,
  programId,
  reserve,
  user1,
  RESERVE_SEED,
  obligation,
  VAULT_SEED,
} from "./utils";
import { Transaction, PublicKey } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress, getOrCreateAssociatedTokenAccount } from "spl-token";
describe("Claim ste reward", () => {
  let configAccount;
  let supplyApyAccount;
  let configBump;
  let supplyApyBump;
  let reserveAccount;
  let reserveBump;
  let vaultAccount;
  let vaultBump;
  let vaultAta;
  let toAta
  const mint = RELEND_MINT;

  before(async () => {
    [configAccount, configBump] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from(CONFIG_SEED), operatorAccount.toBuffer()],
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
    
      vaultAta = await getAssociatedTokenAddress(mint, vaultAccount, true);
      toAta = await getOrCreateAssociatedTokenAccount(connection, operator, mint, operator.publicKey);
  });

  it("Successfully - Supply to earn", async () => {
    const instructions = [
        await program.methods.claimSteReward(new PublicKey("AX3SRJDbGw4QSpMNyWubTQhUV1sww7qsPAy12K3aHrtb"))
        .accounts({
          authority: operator.publicKey,
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
    tx.feePayer = operatorAccount;
    const recoverTx = Transaction.from(tx.serialize({ requireAllSignatures: false }));
    recoverTx.sign(operator);

    await connection.sendRawTransaction(recoverTx.serialize());
  });
});
