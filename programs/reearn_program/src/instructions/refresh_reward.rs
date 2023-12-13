use crate::{constants::*, errors::ReearnErrorCode, state::*};
use anchor_lang::prelude::*;

#[derive(Accounts)]
#[instruction(obligation: Pubkey)]
pub struct RefreshReward<'info> {
    #[account(
        mut,
        address = config_account.operator @ ReearnErrorCode::WrongOperator,
    )]
    pub authority: Signer<'info>,
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
}

pub fn exec(
    ctx: Context<RefreshReward>,
    obligation: Pubkey,
    wallet: Pubkey,
    amount: u64,
    expo: i8,
) -> ProgramResult {
    let obligation_reward = &mut ctx.accounts.obligation_reward;
    let clock = &Clock::get()?;
    let config = &ctx.accounts.config_account;

    require!(obligation_reward.obligation_id == obligation, ReearnErrorCode::WrongObligation);
    require!(obligation_reward.owner == wallet, ReearnErrorCode::WrongWallet);

    if obligation_reward.check_claimable(config, clock) {
        if clock.unix_timestamp - obligation_reward.last_updated > config.lock_duration as i64 {
            if obligation_reward.reward_amount == 0 {
                require!(expo <= 0, ReearnErrorCode::ExpoPositiveNonSupport);
                obligation_reward.exponent = expo;
                obligation_reward.reward_amount = amount;
                obligation_reward.last_updated = clock.unix_timestamp;
            } else {
                msg!("Already refreshed")
            }
        } else {
            msg!("Only allowed to refresh once per lock duration")
        }
    } else {
        msg!("Not claimable")
    }

    Ok(())
}
