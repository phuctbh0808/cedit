use crate::{constants::*, errors::ReearnErrorCode, state::*};
use anchor_lang::prelude::*;

#[derive(Accounts)]
#[instruction(obligation: Pubkey, wallet: Pubkey, reserve: Pubkey)]
pub struct SupplyToEarn<'info> {
    #[account(
        mut,
    )]
    pub authority: Signer<'info>,
    #[account(
        init_if_needed,
        seeds = [RESERVE_REWARD_SEED, reserve.as_ref(), obligation.as_ref()],
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
    pub system_program: Program<'info, System>,
}

pub fn exec(
    ctx: Context<SupplyToEarn>,
    obligation: Pubkey,
    wallet: Pubkey,
    reserve: Pubkey,
    total_liquidity_amount: u64,
) -> ProgramResult {
    let clock = &Clock::get()?;
    let reserve_reward = &mut ctx.accounts.reserve_reward;

    if !reserve_reward.initialized {
        reserve_reward.initialized = true;
        reserve_reward.obligation_id = obligation;
        reserve_reward.reserve = reserve;
        reserve_reward.owner = wallet;
        reserve_reward.accumulated_reward_amount = 0;
        reserve_reward.last_supply = clock.unix_timestamp;
        reserve_reward.supply_amount = total_liquidity_amount;
    } else {
        let supply_apy = &ctx.accounts.supply_apy;
        require!(reserve_reward.owner == wallet, ReearnErrorCode::WrongWallet);
        require!(reserve_reward.obligation_id == obligation, ReearnErrorCode::WrongObligation);
        require!(reserve_reward.reserve == reserve, ReearnErrorCode::WrongReserve);
    
        let current_reward = supply_apy.calculate_reward(reserve_reward.supply_amount, clock.unix_timestamp - reserve_reward.last_supply);
        reserve_reward.accumulated_reward_amount = reserve_reward.accumulated_reward_amount.checked_add(current_reward).unwrap();
        reserve_reward.last_supply = clock.unix_timestamp;
        reserve_reward.supply_amount = total_liquidity_amount;
    }

    Ok(())
}