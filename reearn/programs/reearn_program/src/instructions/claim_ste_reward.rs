use crate::{constants::*, errors::ReearnErrorCode, id::RELEND_PROGRAM, state::*};
use anchor_lang::prelude::*;
use anchor_spl::token::{TokenAccount, Mint, Token, Transfer, self};
use relend_sdk::state::{Obligation, Reserve};
use solana_program::program_pack::{IsInitialized, Pack};

#[derive(Accounts)]
#[instruction(wallet: Pubkey)]
pub struct ClaimReserveReward<'info> {
    #[account(
        mut,
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
     /// CHECK: general account for reserve
     pub reserve: AccountInfo<'info>,
    #[account(
        mut,
        seeds = [RESERVE_REWARD_SEED, reserve.key.as_ref(), obligation.key.as_ref()],
        bump,
    )]
    pub reserve_reward: Account<'info, ReserveReward>,
    #[account(
        mut,
        seeds = [SUPPLY_APY_SEED, reserve.key.as_ref()],
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
) -> ProgramResult {
    msg!("Checking obligation owner");
    let obligation_info = &ctx.accounts.obligation;
    if *obligation_info.owner != RELEND_PROGRAM {
        msg!("Obligation info {} {} ", obligation_info.owner, RELEND_PROGRAM);

        msg!("Obligation provided is not owned by the lending program");
        return Err(ReearnErrorCode::InvalidAccountOwner.into());
    }

    let reserve_info = &ctx.accounts.reserve;
    msg!("Checking reserve owner");
    if *reserve_info.owner != RELEND_PROGRAM {
        msg!("Reserve provided is not owned by the lending program");
        return Err(ReearnErrorCode::InvalidAccountOwner.into());
    }

    msg!("Unpacking reserve data");
    let reserve = Reserve::unpack(&reserve_info.data.borrow())?;
    
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
        reserve_reward.reserve == *reserve_info.key,
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
    match obligation.find_collateral_in_deposits(reserve_reward.reserve) {
        Ok((collateral, _)) => {
            let reserve_decimals = reserve.liquidity.mint_decimals;
            msg!("Calculating reward {} {} {} {}", collateral.deposited_amount, reserve_decimals, clock.unix_timestamp, reserve_reward.last_supply);
            let current_reward = supply_apy.calculate_reward(
                collateral.deposited_amount, reserve_decimals as u32,
                 clock.unix_timestamp - reserve_reward.last_supply)?;
            let total_claim_reward = reserve_reward.accumulated_reward_amount + current_reward;
            reserve_reward.last_supply = clock.unix_timestamp;
            reserve_reward.accumulated_reward_amount = 0;
        
            msg!("Preparing reward transfer");
            let destination = &ctx.accounts.token_account;
            let source = &ctx.accounts.vault_token_account;
            let token_program = &ctx.accounts.token_program;
            let vault_account = &ctx.accounts.vault;
            let config_account = &ctx.accounts.config_account;
            let config_key = config_account.clone().key();
            let bump = config_account.vault_bump[0];

            msg!("Reearn_program:claim_ste_reward_ins:{}:{}", collateral.deposit_reserve, total_claim_reward);
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

            msg!("Transferring reward");
        
            token::transfer(cpi_ctx, total_claim_reward)?;
        }
        Err(e) => {
            msg!("Collateral not found for deposit reserve {}", reserve_reward.reserve);
            msg!("Skipping reward calculation and reset accumulated reward amount to zero");
            reserve_reward.accumulated_reward_amount = 0;
            reserve_reward.last_supply = clock.unix_timestamp;

            return Err(e.into());
        }
    }

    Ok(())
}