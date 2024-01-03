use crate::{constants::*, errors::ReearnErrorCode, state::*};
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct ChangeLockDuration<'info> {
    #[account(
        mut,
        address = config_account.admin @ ReearnErrorCode::OnlyAdmin,
    )]
    pub authority: Signer<'info>,
    #[account(
        mut,
        seeds = [CONFIG_SEED, config_account.admin.as_ref()],
        bump = config_account.bump[0],
    )]
    pub config_account: Account<'info, Config>,
}

pub fn exec(ctx: Context<ChangeLockDuration>, duration: u32) -> ProgramResult {
    let config = &mut ctx.accounts.config_account;

    if duration == 0 {
        return Err(ReearnErrorCode::InvalidLockDuration.into());
    }

    if duration == config.lock_duration {
        return Ok(());
    }

    config.change_lock_duration(duration)
}