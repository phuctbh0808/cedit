use crate::{constants::*, errors::ReearnErrorCode, state::*};
use anchor_lang::prelude::*;

#[derive(Accounts)]
#[instruction(obligation: Pubkey)]
pub struct RegisterForEarn<'info> {
    #[account(
        mut,
        address = config_account.operator @ ReearnErrorCode::WrongOperator,
    )]
    pub authority: Signer<'info>,
    #[account(
        init_if_needed,
        seeds = [OBLIGATION_REWARD_SEED, obligation.as_ref()],
        bump,
        payer = authority,
        space = ObligationReward::LEN,
    )]
    pub obligation_reward: Account<'info, ObligationReward>,
    #[account(
        mut,
        seeds = [CONFIG_SEED, config_account.admin.as_ref()],
        bump = config_account.bump[0],
    )]
    pub config_account: Account<'info, Config>,
    pub system_program: Program<'info, System>,
}

pub fn exec(
    ctx: Context<RegisterForEarn>,
    obligation: Pubkey,
    wallet: Pubkey
) -> ProgramResult {
    let obligation_reward = &mut ctx.accounts.obligation_reward;
    let clock = &Clock::get()?;

    if !obligation_reward.initialized {
        obligation_reward.initialized = true;
        obligation_reward.obligation_id = obligation;
        obligation_reward.owner = wallet;
        obligation_reward.last_claimed = clock.unix_timestamp;
        obligation_reward.last_updated = clock.unix_timestamp;
        obligation_reward.reward_amount = 0;
        obligation_reward.exponent = 0;
    }

    Ok(())
}