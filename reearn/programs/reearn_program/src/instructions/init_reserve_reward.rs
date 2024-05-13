use crate::{constants::*, errors::ReearnErrorCode, state::*};
use anchor_lang::prelude::*;

#[derive(Accounts)]
#[instruction(reserve: Pubkey)]
pub struct InitReserveReward<'info> {
    #[account(mut)]
    pub fee_payer: Signer<'info>,
    #[account(
        mut,
        address = config_account.operator @ ReearnErrorCode::WrongOperator,
    )]
    pub authority: Signer<'info>,
    #[account(
        init_if_needed,
        seeds = [SUPPLY_APY_SEED, reserve.as_ref()],
        bump,
        payer = authority,
        space = SupplyApy::LEN,
    )]
    pub supply_apy: Account<'info, SupplyApy>,
    #[account(
        mut,
        seeds = [CONFIG_SEED, config_account.admin.as_ref()],
        bump = config_account.bump[0],
    )]
    pub config_account: Account<'info, Config>,
    pub system_program: Program<'info, System>,
}

pub fn exec(ctx: Context<InitReserveReward>, reserve: Pubkey, reward: Pubkey, apy: f32, token_decimals: u8, start_time: u64, end_time: u64) -> ProgramResult {
    let supply_apy = &mut ctx.accounts.supply_apy;
    msg!("Supply APY account address is: {:?}", supply_apy.key());
    if !supply_apy.initialized {
        supply_apy.initialized = true;
        supply_apy.reserve = reserve;
        supply_apy.reward_token = reward;
        supply_apy.token_decimals = token_decimals;
        supply_apy.apy = apy;
        supply_apy.start_time = start_time;
        supply_apy.end_time = end_time;
    }

    msg!("Supply APY account is initialized: {:?}", supply_apy);
    Ok(())
}