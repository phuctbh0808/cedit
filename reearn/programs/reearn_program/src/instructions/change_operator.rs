use crate::{constants::*, errors::ReearnErrorCode, state::*};
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct ChangeOperator<'info> {
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

pub fn exec(ctx: Context<ChangeOperator>, new_operator: Pubkey) -> ProgramResult {
    let config = &mut ctx.accounts.config_account;
    config.change_operator(new_operator)
}