import * as anchor from "@coral-xyz/anchor";
import * as token from "@solana/spl-token";
import { ReearnProgram } from "../../target/types/reearn_program";
import { BN, Program } from "@coral-xyz/anchor";
import {assert, expect} from "chai";
import {createMint} from "spl-token";
import {CONFIG_SEED, payer, SUPPLY_REWARD_SEED, VAULT_SEED, wallet} from "../utils";
import {Keypair, PublicKey, SendTransactionError, SystemProgram, SYSVAR_RENT_PUBKEY} from "@solana/web3.js";

describe("Reearn Close Reserve Account", () => {
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);
    const program = anchor.workspace.ReearnProgram as Program<ReearnProgram>;
    let tokenMint: anchor.web3.PublicKey;
    let configAccount: anchor.web3.PublicKey;
    let configBump: number;
    let vaultAccount: anchor.web3.PublicKey;
    let vaultBump: number;
    let reserve: Keypair;
    let authority: Keypair;
    let payer: Keypair;
    let supplyApyAccount: PublicKey;

    before(async () => {
        authority = anchor.web3.Keypair.generate();
        payer = anchor.web3.Keypair.generate();
        [configAccount, configBump] = anchor.web3.PublicKey.findProgramAddressSync(
            [Buffer.from(CONFIG_SEED), authority.publicKey.toBuffer()],
            program.programId
        );
        [vaultAccount, vaultBump] = anchor.web3.PublicKey.findProgramAddressSync(
            [Buffer.from(VAULT_SEED), configAccount.toBuffer()],
            program.programId,
        );
        await provider.connection.requestAirdrop(authority.publicKey, 1000000000000);
        await delay(5000);
        tokenMint = await createMint(provider.connection, authority, authority.publicKey, authority.publicKey, 6);
        reserve = anchor.web3.Keypair.generate();

        [supplyApyAccount] = anchor.web3.PublicKey.findProgramAddressSync(
            [Buffer.from(SUPPLY_REWARD_SEED), reserve.publicKey.toBuffer()],
            program.programId,
        );
    });

    it("Is initialized!", async () => {
        await provider.connection.requestAirdrop(payer.publicKey, 1000000000000);
        await delay(5000);
        try {
            const tx = await program.methods
                .initialize(configBump, vaultBump, authority.publicKey)
                .accounts({
                    feePayer: payer.publicKey,
                    authority: authority.publicKey,
                    configAccount: configAccount,
                    vault: vaultAccount,
                })
                .signers([payer, authority])
                .rpc();
            console.log("Initialize success at tx", tx);

            const currentTime = await provider.connection.getBlockTime(await provider.connection.getSlot());
            const txHash = await program.methods.initReserveReward(reserve.publicKey, tokenMint, 2.0, 6, new BN(currentTime + 5), new BN(currentTime + 5000)).accounts({
                feePayer: payer.publicKey,
                authority: authority.publicKey,
                supplyApy: supplyApyAccount,
                configAccount,
            })
                .signers([authority, payer])
                .rpc();

            console.log("Initialize reserve reward success at tx ", txHash);
        } catch (error) {
            console.error(error);
            throw error;
        }
    });

    it("FAILED WrongOperator - Close reserve account without authority", async () => {
        try {
            const tx = await program.methods.closeReserveReward(reserve.publicKey)
                .accounts({
                    authority: payer.publicKey,
                    feePayer: payer.publicKey,
                    supplyApy: supplyApyAccount,
                    configAccount,
                })
                .signers([payer])
                .rpc();
            assert(false);
        } catch (err) {
            expect(err.logs.some((log) => log.includes("Custom program error: 0x1771")));
        }
    });

    it("Close an account success", async () => {
        try {
            await program.account.supplyApy.fetch(supplyApyAccount);
            const tx = await program.methods.closeReserveReward(reserve.publicKey)
                .accounts({
                    authority: authority.publicKey,
                    feePayer: payer.publicKey,
                    supplyApy: supplyApyAccount,
                    configAccount,
                })
                .signers([authority])
                .rpc();
            console.log("Close reserve account success at tx", tx);
        } catch (err) {
            console.error(err);
            throw err;
        }
        try {
            await program.account.supplyApy.fetch(supplyApyAccount);
        } catch (err) {
            assert(err.toString().includes("Account does not exist"));
        }
    });

    it("Init reserve reward success after closing", async () => {
        const currentTime = await provider.connection.getBlockTime(await provider.connection.getSlot());
        try {
            const tx = await program.methods.initReserveReward(reserve.publicKey, tokenMint, 2.0, 6, new BN(currentTime + 5), new BN(currentTime + 5000)).accounts({
                feePayer: payer.publicKey,
                authority: authority.publicKey,
                supplyApy: supplyApyAccount,
                configAccount,
            })
                .signers([authority, payer])
                .rpc();
            const supplyApyAccountData = await program.account.supplyApy.fetch(supplyApyAccount);
            assert(supplyApyAccountData.reserve.equals(reserve.publicKey));
            assert(supplyApyAccountData.rewardToken.equals(tokenMint));
            assert(supplyApyAccountData.apy === 2.0);
            assert(supplyApyAccountData.tokenDecimals === 6);
            assert(supplyApyAccountData.startTime.eq(new BN(currentTime + 5)));
            assert(supplyApyAccountData.endTime.eq(new BN(currentTime + 5000)));
        } catch (err) {
            console.error(err);
            throw err;
        }
    })
});

function delay(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
}