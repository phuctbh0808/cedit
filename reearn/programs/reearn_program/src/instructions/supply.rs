use crate::{constants::*, state::*};
use anchor_lang::prelude::*;
use anchor_spl::{token::{TokenAccount, Mint, Token, Transfer, self}, associated_token::AssociatedToken};
use crate::id::*;

#[derive(Accounts)]
pub struct SupplyReward<'info> {
    #[account(mut)]
    fee_payer: Signer<'info>,
    #[account()]
    pub authority: Signer<'info>,
    #[account(
        mut,
        associated_token::mint = mint, 
        associated_token::authority = authority
    )]
    pub token_account: Account<'info, TokenAccount>,
    #[account(
        mut,
        seeds = [VAULT_SEED, config_account.key().as_ref()],
        bump = config_account.vault_bump[0],
        constraint = vault.lamports() > 0 && vault.data_is_empty(),
    )]
    /// CHECK: general account for vault
    pub vault: AccountInfo<'info>,
    #[account(
        init_if_needed,
        payer = fee_payer,
        associated_token::mint = mint, 
        associated_token::authority = vault
    )]
    pub vault_token_account: Account<'info, TokenAccount>,
    #[account(address = RELEND)]
    pub mint: Account<'info, Mint>,
    #[account(
        mut,
        seeds = [CONFIG_SEED, config_account.admin.as_ref()],
        bump = config_account.bump[0],
    )]
    pub config_account: Account<'info, Config>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn exec(
    ctx: Context<SupplyReward>,
    amount: u64,
) -> ProgramResult {
    let source = &ctx.accounts.token_account;
    let destination = &ctx.accounts.vault_token_account;
    let token_program = &ctx.accounts.token_program;
    let authority = &ctx.accounts.authority;

    let cpi_accounts = Transfer {
        from: source.to_account_info().clone(),
        to: destination.to_account_info().clone(),
        authority: authority.to_account_info().clone(),
    };
    let cpi_program = token_program.to_account_info();

    token::transfer(
        CpiContext::new(cpi_program, cpi_accounts), amount)?;
    
    Ok(())
}