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
} from "./utils";
import { SystemProgram, Transaction, SendTransactionError } from "@solana/web3.js";
import { expect } from "chai";
describe("Supply to earn", () => {
  let configAccount;
  let supplyApyAccount;
  let configBump;
  let supplyBump;

  before(() => {
    [configAccount, configBump] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from(CONFIG_SEED), operatorAccount.toBuffer()],
      programId
    );

    [supplyApyAccount, supplyBump] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from(SUPPLY_REWARD_SEED), reserve.toBuffer()],
      programId
    );
  });

  it("Failed - Cannot init supply APY config without admin role", async () => {
    try {
      const instructions = [
        await program.methods
          .initReserveReward(reserve, RELEND_MINT, 2.0, 9)
          .accounts({
            feePayer: user1.publicKey,
            authority: user1.publicKey,
            supplyApy: supplyApyAccount,
            configAccount,
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

  it("Successfully - Init supply APY config", async () => {
    const instructions = [
      await program.methods
        .initReserveReward(reserve, RELEND_MINT, 2.0, 9)
        .accounts({
          feePayer: operatorAccount,
          authority: operatorAccount,
          supplyApy: supplyApyAccount,
          configAccount,
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
