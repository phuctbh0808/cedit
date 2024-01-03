use anchor_lang::prelude::*;

declare_id!("5eLFCRaYaNkJHRKBTTiFjXK8wbPRn1WkT631CWMYYvEr");

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
}
