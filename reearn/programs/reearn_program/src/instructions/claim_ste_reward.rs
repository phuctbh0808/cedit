use crate::{constants::*, errors::ReearnErrorCode, id::{RELEND_PROGRAM}, state::*};
use anchor_lang::prelude::*;
use anchor_spl::token::{TokenAccount, Mint, Token, Transfer, self};
use relend_sdk::state::Obligation;
use solana_program::program_pack::{IsInitialized, Pack};

#[derive(Accounts)]
#[instruction(wallet: Pubkey, reserve: Pubkey)]
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
    #[account(address = supply_apy.reward_token @ ReearnErrorCode::WrongRewardToken)]
    pub mint: Account<'info, Mint>,
    /// CHECK: general account for obligation
    pub obligation: AccountInfo<'info>,
    #[account(
        mut,
        seeds = [RESERVE_REWARD_SEED, reserve.as_ref(), obligation.key.as_ref()],
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
    wallet: Pubkey,
    reserve: Pubkey,
) -> ProgramResult {
    msg!("Checking obligation owner");
    let obligation_info = &ctx.accounts.obligation;
    if *obligation_info.owner != RELEND_PROGRAM {
        msg!("Obligation provided is not owned by the lending program");
        return Err(ReearnErrorCode::InvalidAccountOwner.into());
    }
    
    let reserve_reward = &mut ctx.accounts.reserve_reward;
    let supply_apy = &ctx.accounts.supply_apy;
    let clock = &Clock::get()?;

    require!(
        reserve_reward.obligation_id == *obligation_info.key,
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

    msg!("Unpacking obligation data");
    let obligation = Obligation::unpack(&obligation_info.data.borrow())?;
    msg!("Checking obligation initialized");
    if !obligation.is_initialized() {
        msg!("Obligation is not initialized");
        return Err(ReearnErrorCode::WrongObligation.into());
    }

    msg!("Finding collateral in deposits");
    let (collateral, _)  = obligation.find_collateral_in_deposits(reserve)?;
    
    msg!("Calculating reward");
    let supply_amount = collateral.deposited_amount.checked_div(
        10u64.checked_pow(9).ok_or(ReearnErrorCode::MathOverflow)?
    ).ok_or(ReearnErrorCode::MathOverflow)?;
    let current_reward = supply_apy.calculate_reward(supply_amount, clock.unix_timestamp - reserve_reward.last_supply);
    let total_claim_reward = reserve_reward.accumulated_reward_amount + current_reward;
    reserve_reward.last_supply = clock.unix_timestamp;
    reserve_reward.accumulated_reward_amount = 0.0;

    msg!("Preparing reward transfer");
    let billion = 10u64;
    let reward_decimals = billion
        .checked_pow(supply_apy.token_decimals as u32)
        .ok_or(ReearnErrorCode::MathOverflow)?;

    let calculated_reward = (total_claim_reward * (reward_decimals as f64)) as u64;

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