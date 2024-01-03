use crate::state::config::Config;
use anchor_lang::prelude::*;

#[account]
pub struct ObligationReward {
    pub obligation_id: Pubkey,
    pub owner: Pubkey,
    pub last_claimed: i64,
    pub reward_amount: u64,
    pub exponent: i8,
    pub initialized: bool,
    pub last_updated: i64,
}

impl ObligationReward {
    pub const LEN: usize = 8 + 32 + 32 + 8 + 8 + 1 + 1 + 8;

    pub fn check_claimable(&self, config: &Config, clock: &Clock) -> bool {
        let elapsed = clock.unix_timestamp - self.last_claimed;
        if elapsed < config.lock_duration as i64 {
            return false;
        }

        return true;
    }
}