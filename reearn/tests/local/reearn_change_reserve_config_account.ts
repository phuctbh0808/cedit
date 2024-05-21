import * as anchor from "@coral-xyz/anchor";
import * as token from "@solana/spl-token";
import { ReearnProgram } from "../../target/types/reearn_program";
import { BN, Program } from "@coral-xyz/anchor";
import {assert, expect} from "chai";
import {createMint} from "spl-token";
import {CONFIG_SEED, payer, SUPPLY_REWARD_SEED, VAULT_SEED, wallet} from "../utils";
import {Keypair, PublicKey, SendTransactionError, SystemProgram, SYSVAR_RENT_PUBKEY} from "@solana/web3.js";

describe("Reearn Change Reserve Account", async () => {
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);
    const program = anchor.workspace.ReearnProgram as Program<ReearnProgram>;
    // const defaultWallet = getDefaultWallet();
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
        payer = authority;
        // payer = anchor.web3.Keypair.generate();
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

            console.log("Initialize program success at tx ", tx);
        } catch (error) {
            console.error(error);
            throw error;
        }
    });

    it("Failed WrongTimeRange - Change account that has startTime > endTime", async () => {
        const currentTime = await provider.connection.getBlockTime(await provider.connection.getSlot());
        await reinitializeReserveAccount(currentTime + 5, currentTime + 10)
        try {
            const tx = await program.methods.changeSupplyApy(tokenMint, 2.0, 6, new BN(2000), new BN(1000)).accounts({
                authority: authority.publicKey,
                supplyApy: supplyApyAccount,
                configAccount,
            })
                .signers([authority])
                .rpc();
            assert(false);
        } catch (err) {
            expect(err.logs.some((log) => log.includes("Custom program error: 0x177c")));
        }
    });

    it("FAILED StartTooSoon - Change startTime lower than currentTime in case has NOT passed startTime", async () => {
        const currentTime = await provider.connection.getBlockTime(await provider.connection.getSlot());
        await reinitializeReserveAccount(currentTime + 5, currentTime + 15)

        await delay(3000);
        try {
            const tx = await program.methods.changeSupplyApy(tokenMint, 2.0, 6, new BN(currentTime + 1), new BN(currentTime + 15)).accounts({
                authority: authority.publicKey,
                supplyApy: supplyApyAccount,
                configAccount,
            })
                .signers([authority])
                .rpc();
            assert(false);
        } catch (err) {
            expect(err.logs.some((log) => log.includes("Custom program error: 0x177d")));
        }
    });

    it("Changed time success in case time has NOT passed passed startTime", async () => {
        const currentTime = await provider.connection.getBlockTime(await provider.connection.getSlot());
        await reinitializeReserveAccount(currentTime + 10, currentTime + 50)
        try {
            const tx = await program.methods.changeSupplyApy(tokenMint, 2.0, 6, new BN(currentTime + 5), new BN(currentTime + 30)).accounts({
                authority: authority.publicKey,
                supplyApy: supplyApyAccount,
                configAccount,
            })
                .signers([authority])
                .rpc();
            await delay(2000);
            const supplyApyAccountData = await program.account.supplyApy.fetch(supplyApyAccount);
            assert(supplyApyAccountData.startTime.toNumber() === currentTime + 5);
            assert(supplyApyAccountData.endTime.toNumber() === currentTime + 30);
        } catch (err) {
            console.error(err);
            throw err;
        }
    });

    it("FAILED WrongStartTime - Change start time that has passed", async () => {
        const currentTime = await provider.connection.getBlockTime(await provider.connection.getSlot());
        await reinitializeReserveAccount(currentTime + 5, currentTime + 15)
        await delay(7000);
        try {
            const tx = await program.methods.changeSupplyApy(tokenMint, 2.0, 6, new BN(currentTime + 3), new BN(currentTime + 15)).accounts({
                authority: authority.publicKey,
                supplyApy: supplyApyAccount,
                configAccount,
            })
                .signers([authority])
                .rpc();
            assert(false);
        } catch (err) {
            expect(err.logs.some((log) => log.includes("Custom program error: 0x177e")));
        }
    });

    it("FAILED EndTooSoon - Changed endTime less than currentTime in case time passed startTime", async () => {
        const currentTime = await provider.connection.getBlockTime(await provider.connection.getSlot());
        await reinitializeReserveAccount(currentTime + 5, currentTime + 50)
        await delay(7000);
        try {
            const tx = await program.methods.changeSupplyApy(tokenMint, 2.0, 6, new BN(currentTime + 5), new BN(currentTime + 6)).accounts({
                authority: authority.publicKey,
                supplyApy: supplyApyAccount,
                configAccount,
            })
                .signers([authority])
                .rpc();
            assert(false);
        } catch (err) {
            expect(err.logs.some((log) => log.includes("Custom program error: 0x177f")));
        }
    });

    it("Changed endTime success in case time passed startTime", async () => {
        const currentTime = await provider.connection.getBlockTime(await provider.connection.getSlot());
        await reinitializeReserveAccount(currentTime + 5, currentTime + 50)
        await delay(7000);
        try {
            const tx = await program.methods.changeSupplyApy(tokenMint, 2.0, 6, new BN(currentTime + 5), new BN(currentTime + 30)).accounts({
                authority: authority.publicKey,
                supplyApy: supplyApyAccount,
                configAccount,
            })
                .signers([authority])
                .rpc();
            await delay(2000);
            const supplyApyAccountData = await program.account.supplyApy.fetch(supplyApyAccount);
            assert(supplyApyAccountData.startTime.toNumber() === currentTime + 5);
            assert(supplyApyAccountData.endTime.toNumber() === currentTime + 30);
        } catch (err) {
            console.error(err);
            throw err;
        }
    });

    it("FAILED StartTooSoon - Change startTime less than currentTime  after time passed endTime", async () => {
        const currentTime = await provider.connection.getBlockTime(await provider.connection.getSlot());
        await reinitializeReserveAccount(currentTime + 5, currentTime + 10)
        await delay(15000);
        try {
            const tx = await program.methods.changeSupplyApy(tokenMint, 2.0, 6, new BN(currentTime + 10), new BN(currentTime + 30)).accounts({
                authority: authority.publicKey,
                supplyApy: supplyApyAccount,
                configAccount,
            })
                .signers([authority])
                .rpc();
            console.assert(false);
        } catch (err) {
            expect(err.logs.some((log) => log.includes("Custom program error: 0x177d")));
        }
    });

    it("Change time successfully after time passed endTime", async () => {
        const currentTime = await provider.connection.getBlockTime(await provider.connection.getSlot());
        await reinitializeReserveAccount(currentTime + 5, currentTime + 10)
        await delay(15000);
        try {
            const tx = await program.methods.changeSupplyApy(tokenMint, 2.0, 6, new BN(currentTime + 30), new BN(currentTime + 50)).accounts({
                authority: authority.publicKey,
                supplyApy: supplyApyAccount,
                configAccount,
            })
                .signers([authority])
                .rpc();
            const supplyApyData = await program.account.supplyApy.fetch(supplyApyAccount);
            assert(supplyApyData.startTime.eq(new BN(currentTime + 30)));
            assert(supplyApyData.endTime.eq(new BN(currentTime + 50)));
        } catch (err) {
            console.error(err);
            throw err;
        }
    });


    async function reinitializeReserveAccount(startTime: number, endTime: number) {
        try {
            await program.methods.closeReserveReward(reserve.publicKey)
                .accounts({
                    authority: authority.publicKey,
                    feePayer: payer.publicKey,
                    supplyApy: supplyApyAccount,
                    configAccount,
                }).signers([authority]).rpc();
        } catch (err) {}

        const tx = await program.methods.initReserveReward(reserve.publicKey, tokenMint, 2.0, 6, new BN(startTime), new BN(endTime)).accounts({
            feePayer: payer.publicKey,
            authority: authority.publicKey,
            supplyApy: supplyApyAccount,
            configAccount,
        })
            .signers([payer])
            .rpc();
        console.log("Reinitialize account success");
    }
    async function getCurrentTime() {
        return await provider.connection.getBlockTime(await provider.connection.getSlot());
    }
});

function delay(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
}