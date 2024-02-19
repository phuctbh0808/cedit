use crate::{constants::*, errors::ReearnErrorCode, id::RELEND_PROGRAM, state::*};
use anchor_lang::prelude::*;
use relend_sdk::state::Obligation;
use solana_program::program_pack::{IsInitialized, Pack};

#[derive(Accounts)]
#[instruction(wallet: Pubkey, reserve: Pubkey)]
pub struct SupplyToEarn<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        init_if_needed,
        seeds = [RESERVE_REWARD_SEED, reserve.as_ref(), obligation.key.as_ref()],
        bump,
        payer = authority,
        space = ReserveReward::LEN,
    )]
    pub reserve_reward: Account<'info, ReserveReward>,
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
    /// CHECK: general account for obligation
    pub obligation: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}

pub fn exec(ctx: Context<SupplyToEarn>, wallet: Pubkey, reserve: Pubkey) -> ProgramResult {
    let authority = &ctx.accounts.authority;
    let reserve_reward = &mut ctx.accounts.reserve_reward;
    let config_account = &ctx.accounts.config_account;
    let obligation_info = &ctx.accounts.obligation;
    msg!("Checking obligation owner");
    if *obligation_info.owner != RELEND_PROGRAM {
        msg!("Obligation provided is not owned by the lending program");
        return Err(ReearnErrorCode::InvalidAccountOwner.into());
    }

    msg!("Unpacking obligation data");
    let obligation = Obligation::unpack(&obligation_info.data.borrow())?;
    msg!("Checking obligation initialized");
    if !obligation.is_initialized() {
        msg!("Obligation is not initialized");
        return Err(ReearnErrorCode::WrongObligation.into());
    }

    msg!("Checking authority");
    if *authority.key != config_account.operator
        && *authority.key != config_account.admin
        && *authority.key != obligation.owner
    {
        return Err(ReearnErrorCode::WrongOperator.into());
    }

    let clock = &Clock::get()?;
   
    if !reserve_reward.initialized {
        msg!("Initializing reserve reward");
        reserve_reward.initialized = true;
        reserve_reward.obligation_id = *obligation_info.key;
        reserve_reward.reserve = reserve;
        reserve_reward.owner = obligation.owner;
        reserve_reward.accumulated_reward_amount = 0.0;
        reserve_reward.last_supply = clock.unix_timestamp;
    } else {
        msg!("Refreshing reserve reward");
        let supply_apy = &ctx.accounts.supply_apy;
        require!(reserve_reward.owner == wallet, ReearnErrorCode::WrongWallet);
        require!(
            reserve_reward.obligation_id == *obligation_info.key,
            ReearnErrorCode::WrongObligation
        );
        require!(
            reserve_reward.reserve == reserve,
            ReearnErrorCode::WrongReserve
        );

        msg!("Finding collateral in deposits");
        let (collateral, _) = obligation.find_collateral_in_deposits(reserve)?;

        msg!("Calculating reward");
        let supply_amount = collateral
            .deposited_amount
            .checked_div(10u64.checked_pow(9).ok_or(ReearnErrorCode::MathOverflow)?)
            .ok_or(ReearnErrorCode::MathOverflow)?;
        let current_reward = supply_apy.calculate_reward(
            supply_amount,
            clock.unix_timestamp - reserve_reward.last_supply,
        );
        reserve_reward.accumulated_reward_amount =
            reserve_reward.accumulated_reward_amount + current_reward;
        reserve_reward.last_supply = clock.unix_timestamp;
    }

    Ok(())
}
