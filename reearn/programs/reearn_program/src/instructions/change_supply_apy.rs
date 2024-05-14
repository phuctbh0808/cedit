use crate::{constants::*, errors::ReearnErrorCode, state::*};
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct ChangeSupplyApy<'info> {
    #[account(
        mut,
        address = config_account.operator @ ReearnErrorCode::WrongOperator,
    )]
    pub authority: Signer<'info>,
    #[account(
        mut,
        seeds = [SUPPLY_APY_SEED, supply_apy.reserve.as_ref()],
        bump,
    )]
    pub supply_apy: Account<'info, SupplyApy>,
    #[account(
        mut,
        seeds = [CONFIG_SEED, config_account.admin.as_ref()],
        bump = config_account.bump[0],
    )]
    pub config_account: Account<'info, Config>,
}

pub fn exec(
    ctx: Context<ChangeSupplyApy>,
    reward: Pubkey,
    apy: f32,
    token_decimals: u8,
    start_time: i64,
    end_time: i64,
) -> ProgramResult {
    let supply_apy = &mut ctx.accounts.supply_apy;
    supply_apy.reward_token = reward;
    supply_apy.token_decimals = token_decimals;
    supply_apy.apy = apy;
    supply_apy.start_time = start_time;
    supply_apy.end_time = end_time;

    Ok(())
}
