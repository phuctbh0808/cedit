import * as anchor from "@coral-xyz/anchor";
import * as token from "@solana/spl-token";
import { ReearnProgram } from "../../target/types/reearn_program";
import { BN, Program } from "@coral-xyz/anchor";
import {assert, expect} from "chai";
import {createMint} from "spl-token";
import {CONFIG_SEED, payer, SUPPLY_REWARD_SEED, VAULT_SEED, wallet} from "../utils";
import {Keypair, PublicKey, SendTransactionError, SystemProgram, SYSVAR_RENT_PUBKEY} from "@solana/web3.js";

describe("Reearn", () => {
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
    let supplyApyAccount: PublicKey;
    let supplyBump: number;

    before(async () => {
        [configAccount, configBump] = anchor.web3.PublicKey.findProgramAddressSync(
            [Buffer.from(CONFIG_SEED), provider.publicKey.toBuffer()],
            program.programId
        );
        [vaultAccount, vaultBump] = anchor.web3.PublicKey.findProgramAddressSync(
            [Buffer.from(VAULT_SEED), configAccount.toBuffer()],
            program.programId,
        );
        const payer = (provider.wallet as anchor.Wallet).payer;
        tokenMint = await createMint(provider.connection, payer, provider.publicKey, provider.publicKey, 6);
        reserve = anchor.web3.Keypair.generate();

        [supplyApyAccount, supplyBump] = anchor.web3.PublicKey.findProgramAddressSync(
            [Buffer.from(SUPPLY_REWARD_SEED), reserve.publicKey.toBuffer()],
            program.programId,
        );
    });

    it("Is initialized!", async () => {
        await provider.connection.requestAirdrop(payer.publicKey, 1000000000000);
        await delay(5000);
        try {
            const tx = await program.methods
                .initialize(configBump, vaultBump, provider.publicKey)
                .accounts({
                    feePayer: payer.publicKey,
                    authority: provider.publicKey,
                    configAccount: configAccount,
                    vault: vaultAccount,
                })
                .signers([payer])
                .rpc();

            console.log("Initialize program success at tx ", tx);
        } catch (error) {
            console.error(error);
            throw error;
        }
    });

    it("Failed WrongTimeRange - Init reserve reward startTime > endTime ", async () => {
        // const currentTime = provider.connection.getBlockTime(await provider.connection.getSlot());
        try {
            const tx = await program.methods.initReserveReward(reserve.publicKey, tokenMint, 2.0, 9, new BN(2000), new BN(1000)).accounts({
                    feePayer: payer.publicKey,
                    authority: provider.publicKey,
                    supplyApy: supplyApyAccount,
                    configAccount,
                })
                .signers([payer])
                .rpc();
            assert(false);
        } catch (err) {
            expect(err.logs.some((log) => log.includes("Custom program error: 0x177c")));
        }
    })

    it("Failed WrongTimeRange - Init reserve reward startTime < currentTime ", async () => {
        const currentTime = await provider.connection.getBlockTime(await provider.connection.getSlot());
        try {
            const tx = await program.methods.initReserveReward(reserve.publicKey, tokenMint, 2.0, 9, new BN(currentTime - 5), new BN(currentTime + 5)).accounts({
                feePayer: payer.publicKey,
                authority: provider.publicKey,
                supplyApy: supplyApyAccount,
                configAccount,
            })
                .signers([payer])
                .rpc();
            assert(false);
        } catch (err) {
            expect(err.logs.some((log) => log.includes("Custom program error: 0x177d")));
        }
    })

    it("Init reserve reward success ", async () => {
        const currentTime = await provider.connection.getBlockTime(await provider.connection.getSlot());
        try {
            const tx = await program.methods.initReserveReward(reserve.publicKey, tokenMint, 2.0, 6, new BN(currentTime + 5), new BN(currentTime + 5000)).accounts({
                feePayer: payer.publicKey,
                authority: provider.publicKey,
                supplyApy: supplyApyAccount,
                configAccount,
            })
                .signers([payer])
                .rpc();
            console.log("Enable supply to earn success at tx ", tx);
            const supplyApyAccountData = await program.account.supplyApy.fetch(supplyApyAccount);
            assert(supplyApyAccountData.reserve.equals(reserve.publicKey));
            assert(supplyApyAccountData.rewardToken.equals(tokenMint));
            assert(supplyApyAccountData.apy === 2.0);
            assert(supplyApyAccountData.tokenDecimals === 6);
            assert(supplyApyAccountData.startTime.eq(new BN(currentTime + 5)));
            assert(supplyApyAccountData.endTime.eq(new BN(currentTime + 5000)));
        } catch (err) {
            throw err;
        }
    })
});

function delay(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
}