use crate::{constants::*, errors::ReearnErrorCode, state::*};
use anchor_lang::prelude::*;
use anchor_spl::token::{TokenAccount, Mint, Token, Transfer, self};

#[derive(Accounts)]
#[instruction(obligation: Pubkey, wallet: Pubkey, reserve: Pubkey)]
pub struct ClaimReserveReward<'info> {
    #[account(mut)]
    fee_payer: Signer<'info>,
    #[account(
        address = reserve_reward.owner @ ReearnErrorCode::WrongRewardOwner,
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
    #[account()]
    pub mint: Account<'info, Mint>,
    #[account(
        mut,
        seeds = [RESERVE_REWARD_SEED, reserve.as_ref(), obligation.as_ref()],
        bump,
    )]
    pub reserve_reward: Account<'info, ReserveReward>,
    #[account(
        mut,
        seeds = [SUPPLY_APY_SEED, reserve.as_ref()],
        bump,
    )]
    pub supply_apy: Account<'info, SupplyApy>,
    #[account(
        seeds = [CONFIG_SEED, config_account.admin.as_ref()],
        bump = config_account.bump[0],
    )]
    pub config_account: Account<'info, Config>,
    pub token_program: Program<'info, Token>,
}

pub fn exec(
    ctx: Context<ClaimReserveReward>,
    obligation: Pubkey,
    wallet: Pubkey,
    reserve: Pubkey,
    remain_liquidity_amount: u64,
) -> ProgramResult {
    let reserve_reward = &mut ctx.accounts.reserve_reward;
    let supply_apy = &ctx.accounts.supply_apy;

    let clock = &Clock::get()?;

    require!(
        reserve_reward.obligation_id == obligation,
        ReearnErrorCode::WrongObligation
    );
    require!(
        reserve_reward.owner == wallet,
        ReearnErrorCode::WrongWallet
    );
    require!(
        reserve_reward.reserve == reserve,
        ReearnErrorCode::WrongReserve
    );

    let current_reward = supply_apy.calculate_reward(reserve_reward.supply_amount, clock.unix_timestamp - reserve_reward.last_supply);
    let total_claim_reward = reserve_reward.accumulated_reward_amount.checked_add(current_reward).unwrap();
    reserve_reward.last_supply = clock.unix_timestamp;
    reserve_reward.accumulated_reward_amount = 0;
    reserve_reward.supply_amount = remain_liquidity_amount;

    let billion = 10u64;
    let reward_decimals = billion
        .checked_pow(supply_apy.token_decimals as u32)
        .ok_or(ReearnErrorCode::MathOverflow)?;

    let calculated_reward = total_claim_reward
        .checked_mul(reward_decimals)
        .ok_or(ReearnErrorCode::MathOverflow)?;

    let destination = &ctx.accounts.token_account;
    let source = &ctx.accounts.vault_token_account;
    let token_program = &ctx.accounts.token_program;
    let vault_account = &ctx.accounts.vault;
    let config_account = &ctx.accounts.config_account;
    let config_key = config_account.clone().key();
    let bump = config_account.vault_bump[0];
    let signer: &[&[&[u8]]] = &[&[VAULT_SEED, config_key.as_ref(), &[bump]]];
    let cpi_ctx = CpiContext::new_with_signer(
        token_program.to_account_info(),
        Transfer {
            from: source.to_account_info().clone(),
            to: destination.to_account_info().clone(),
            authority: vault_account.to_account_info().clone(),
        },
        signer,
    );

    msg!("Transfering reward");
    token::transfer(cpi_ctx, calculated_reward)?;

    Ok(())
}