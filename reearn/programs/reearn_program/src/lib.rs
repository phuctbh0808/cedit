use anchor_lang::prelude::*;

declare_id!("DNWtXxdTAjjgZckwCq8sXKnoxGFdD5riNZn4q4zTRqD4");

pub mod constants;
pub mod id;
pub mod errors;
pub mod instructions;
pub mod state;

use instructions::*;

#[program]
pub mod reearn_program {

    use super::*;

    pub fn initialize(
        ctx: Context<Initialize>,
        bump: u8,
        vault_bump: u8,
        operator: Pubkey,
    ) -> ProgramResult {
        initialize::exec(ctx, bump, vault_bump, operator)
    }

    pub fn change_operator(ctx: Context<ChangeOperator>, new_operator: Pubkey) -> ProgramResult {
        change_operator::exec(ctx, new_operator)
    }

    pub fn change_lock_duration(ctx: Context<ChangeLockDuration>, duration: u32) -> ProgramResult {
        change_lock_duration::exec(ctx, duration)
    }

    pub fn refresh_reward(
        ctx: Context<RefreshReward>,
        obligation: Pubkey,
        wallet: Pubkey,
        amount: u64,
        expo: i8,
    ) -> ProgramResult {
        refresh_reward::exec(ctx, obligation, wallet, amount, expo)
    }

    pub fn register_for_earn(
        ctx: Context<RegisterForEarn>,
        obligation: Pubkey,
        wallet: Pubkey,
    ) -> ProgramResult {
        register_for_earn::exec(ctx, obligation, wallet)
    }

    pub fn claim_reward(ctx: Context<ClaimReward>, obligation: Pubkey, wallet: Pubkey) -> ProgramResult {
        claim_reward::exec(ctx, obligation, wallet)
    }

    pub fn supply(ctx: Context<SupplyReward>, amount: u64) -> ProgramResult {
        supply::exec(ctx, amount)
    }

    pub fn init_reserve_reward(
        ctx: Context<InitReserveReward>,
        reserve: Pubkey,
        reward: Pubkey,
        apy: f32,
        token_decimals: u8,
        start_time: u32,
        end_time: u32,
    ) -> ProgramResult {
        init_reserve_reward::exec(ctx, reserve, reward, apy, token_decimals, start_time, end_time)
    }

    pub fn close_reserve_reward(
        ctx: Context<CloseReserveReward>,
        reserve: Pubkey,
    ) -> ProgramResult {
        close_reserve_reward::exec(ctx, reserve)
    }

    pub fn supply_to_earn(
        ctx: Context<SupplyToEarn>,
        wallet: Pubkey,
    ) -> ProgramResult {
        supply_to_earn::exec(ctx, wallet)
    }

    pub fn claim_ste_reward(
        ctx: Context<ClaimReserveReward>,
        wallet: Pubkey,
    ) -> ProgramResult {
        claim_ste_reward::exec(ctx, wallet)
    }

    pub fn change_supply_apy(
        ctx: Context<ChangeSupplyApy>,
        reward: Pubkey,
        apy: f32,
        token_decimals: u8,
    ) -> ProgramResult {
        change_supply_apy::exec(ctx, reward, apy, token_decimals)
    }
}
