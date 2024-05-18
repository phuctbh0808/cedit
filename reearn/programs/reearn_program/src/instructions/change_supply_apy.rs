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
    let current_time = Clock::get()?.unix_timestamp as i64;
    if start_time >= end_time {
        return Err(ReearnErrorCode::StartTimeAfterEndTime.into());
    }

    let supply_apy = &mut ctx.accounts.supply_apy;
    // event is not started yet or ended
    if current_time < supply_apy.start_time || current_time > supply_apy.end_time {
        if current_time > start_time {
            return Err(ReearnErrorCode::StartTimeBeforeCurrent.into());
        }
    }

    // event is active
    if current_time >= supply_apy.start_time && current_time <= supply_apy.end_time {
        if supply_apy.start_time != start_time {
            return Err(ReearnErrorCode::StartTimeImmutable.into());
        }
        if current_time > end_time {
            return Err(ReearnErrorCode::EndTimeAfterCurrent.into());
        }
    }

    supply_apy.reward_token = reward;
    supply_apy.token_decimals = token_decimals;
    supply_apy.apy = apy;
    supply_apy.start_time = start_time;
    supply_apy.end_time = end_time;

    msg!("Supply APY account is updated: {:?}", supply_apy);
    Ok(())
}
