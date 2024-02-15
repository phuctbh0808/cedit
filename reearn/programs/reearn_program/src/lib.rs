use anchor_lang::prelude::*;

declare_id!("B8DbGSZpQroi4qpUV1Cu8jMWzAQUUtY34ESs1ysSUESX");

pub mod constants;
pub mod reward_token;
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
    ) -> ProgramResult {
        init_reserve_reward::exec(ctx, reserve, reward, apy, token_decimals)
    }

    pub fn supply_to_earn(
        ctx: Context<SupplyToEarn>,
        obligation: Pubkey,
        wallet: Pubkey,
        reserve: Pubkey,
        total_liquidity_amount: u64,
    ) -> ProgramResult {
        supply_to_earn::exec(ctx, obligation, wallet, reserve, total_liquidity_amount)
    }
}
