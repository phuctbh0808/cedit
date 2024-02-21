use crate::{constants::*, errors::ReearnErrorCode, state::*};
use anchor_lang::prelude::*;

#[derive(Accounts)]
#[instruction(reserve: Pubkey)]
pub struct ChangeSupplyApy<'info> {
    #[account(
        mut,
        address = config_account.operator @ ReearnErrorCode::WrongOperator,
    )]
    pub authority: Signer<'info>,
    #[account(
        mut,
        seeds = [SUPPLY_APY_SEED, reserve.as_ref()],
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
    reserve: Pubkey,
    reward: Pubkey,
    apy: f32,
    token_decimals: u8,
) -> ProgramResult {
    let supply_apy = &mut ctx.accounts.supply_apy;
    supply_apy.reserve = reserve;
    supply_apy.reward_token = reward;
    supply_apy.token_decimals = token_decimals;
    supply_apy.apy = apy;

    Ok(())
}
