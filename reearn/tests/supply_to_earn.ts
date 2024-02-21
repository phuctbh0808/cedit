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
} from "./utils";
import { SystemProgram, Transaction, SendTransactionError, PublicKey } from "@solana/web3.js";
import { expect } from "chai";
describe("Init supply APY config", () => {
  let configAccount;
  let supplyApyAccount;
  let configBump;
  let supplyApyBump;
  let reserveAccount;
  let reserveBump;

  before(() => {
    [configAccount, configBump] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from(CONFIG_SEED), operatorAccount.toBuffer()],
      programId
    );
    [reserveAccount, reserveBump] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from(RESERVE_SEED), reserve.toBuffer(), obligation.toBuffer()],
      programId
    );
    [supplyApyAccount, supplyApyBump] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from(SUPPLY_REWARD_SEED), reserve.toBuffer()],
      programId
    );
  });

  it("Failed - Cannot supply to earn due to wrong obligation", async () => {
    try {
      const instructions = [
        await program.methods
          .supplyToEarn(new PublicKey("AX3SRJDbGw4QSpMNyWubTQhUV1sww7qsPAy12K3aHrtG"))
          .accounts({
            authority: operator.publicKey,
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
      tx.feePayer = operatorAccount;
      const recoverTx = Transaction.from(tx.serialize({ requireAllSignatures: false }));
      recoverTx.sign(operator);
      await connection.sendRawTransaction(recoverTx.serialize());
    } catch (err) {
      expect(err).to.be.instanceOf(SendTransactionError);
      expect((err as SendTransactionError).message).to.equal(
        "failed to send transaction: Transaction simulation failed: Error processing Instruction 0: custom program error: 0x1771"
      );
    }
  });

  it("Failed - Cannot supply to earn due to wrong signer", async () => {
    try {
      const instructions = [
        await program.methods
          .supplyToEarn(new PublicKey("AX3SRJDbGw4QSpMNyWubTQhUV1sww7qsPAy12K3aHrtG"))
          .accounts({
            authority: user1.publicKey,
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
      tx.feePayer = user1.publicKey;
      const recoverTx = Transaction.from(tx.serialize({ requireAllSignatures: false }));
      recoverTx.sign(user1);
      await connection.sendRawTransaction(recoverTx.serialize());
    } catch (err) {
      expect(err).to.be.instanceOf(SendTransactionError);
      expect((err as SendTransactionError).message).to.equal(
        "failed to send transaction: Transaction simulation failed: Error processing Instruction 0: custom program error: 0x1771"
      );
    }
  });

  it("Successfully - Supply to earn", async () => {
    const instructions = [
        await program.methods
          .supplyToEarn(new PublicKey("AX3SRJDbGw4QSpMNyWubTQhUV1sww7qsPAy12K3aHrtb"))
          .accounts({
            authority: user1.publicKey,
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
    tx.feePayer = operatorAccount;
    const recoverTx = Transaction.from(tx.serialize({ requireAllSignatures: false }));
    recoverTx.sign(operator);

    await connection.sendRawTransaction(recoverTx.serialize());
  });
});
