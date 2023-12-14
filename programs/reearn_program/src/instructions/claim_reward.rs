use crate::{constants::*, errors::ReearnErrorCode, state::*};
use anchor_lang::prelude::*;
use anchor_spl::token::{TokenAccount, Mint, Token, Transfer, self};
use crate::reward_token::*;

#[derive(Accounts)]
#[instruction(obligation: Pubkey)]
pub struct ClaimReward<'info> {
    #[account(mut)]
    fee_payer: Signer<'info>,
    #[account(
        mut,
        address = obligation_reward.owner @ ReearnErrorCode::WrongRewardOwner,
    )]
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
        mut,
        associated_token::mint = mint, 
        associated_token::authority = vault
    )]
    pub vault_token_account: Account<'info, TokenAccount>,
    #[account(address = RELEND_TEST)]
    pub mint: Account<'info, Mint>,
    #[account(
        mut,
        seeds = [OBLIGATION_REWARD_SEED, obligation.as_ref()],
        bump,
    )]
    pub obligation_reward: Account<'info, ObligationReward>,
    #[account(
        mut,
        seeds = [CONFIG_SEED, config_account.admin.as_ref()],
        bump = config_account.bump[0],
    )]
    pub config_account: Account<'info, Config>,
    pub token_program: Program<'info, Token>,
}

pub fn exec(
    ctx: Context<ClaimReward>,
    obligation: Pubkey,
    wallet: Pubkey,
) -> ProgramResult {
    let obligation_reward = &mut ctx.accounts.obligation_reward;
    let clock = &Clock::get()?;
    let config = &ctx.accounts.config_account;

    require!(
        obligation_reward.obligation_id == obligation,
        ReearnErrorCode::WrongObligation
    );
    require!(
        obligation_reward.owner == wallet,
        ReearnErrorCode::WrongWallet
    );

    if obligation_reward.check_claimable(config, clock) {
        require!(obligation_reward.exponent <= 0, ReearnErrorCode::ExpoPositiveNonSupport);
        let exponent = obligation_reward.exponent
            .checked_abs()
            .ok_or(ReearnErrorCode::MathOverflow)?
            .try_into()
            .map_err(|_| ReearnErrorCode::MathOverflow)?;
        let decimals = 10u64
            .checked_pow(exponent)
            .ok_or(ReearnErrorCode::MathOverflow)?;
        let reward_amount = obligation_reward.reward_amount
            .checked_div(decimals)
            .ok_or(ReearnErrorCode::MathOverflow)?;

        let destination = &ctx.accounts.token_account;
        let source = &ctx.accounts.vault_token_account;
        let token_program = &ctx.accounts.token_program;
        let config_account = &ctx.accounts.config_account;

        let cpi_accounts = Transfer {
            from: source.to_account_info().clone(),
            to: destination.to_account_info().clone(),
            authority: config_account.to_account_info().clone(),
        };
        let cpi_program = token_program.to_account_info();

        msg!("Transfering reward");
        token::transfer(
            CpiContext::new(cpi_program, cpi_accounts), reward_amount)?;
        
        obligation_reward.reward_amount = 0;
        obligation_reward.exponent = 0;
        obligation_reward.last_claimed = clock.unix_timestamp;
        obligation_reward.last_updated = clock.unix_timestamp;
    } else {
        return Err(ReearnErrorCode::AlreadyClaimedToday.into());
    }

    Ok(())
}
