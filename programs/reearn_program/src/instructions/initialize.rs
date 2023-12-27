use crate::{constants::*, state::*};
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub fee_payer: Signer<'info>,
    #[account()]
    pub authority: Signer<'info>,
    #[account(
        init,
        seeds = [CONFIG_SEED, authority.key().as_ref()],
        bump,
        payer = fee_payer,
        space = Config::LEN,
    )]
    pub config_account: Account<'info, Config>,
    #[account(
        init,
        owner = config_account.key(),
        seeds = [VAULT_SEED, config_account.key().as_ref()],
        bump,
        payer = fee_payer,
        space = 0,
    )]
    /// CHECK: general account for vault
    pub vault: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn exec(ctx: Context<Initialize>, bump: u8, vault_bump: u8, operator: Pubkey) -> ProgramResult {
    let config = &mut ctx.accounts.config_account;
    config.init(bump, vault_bump, *ctx.accounts.authority.key, operator)
}
