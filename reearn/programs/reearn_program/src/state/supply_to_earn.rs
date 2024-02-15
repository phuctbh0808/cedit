use anchor_lang::prelude::*;

#[account]
pub struct ReserveReward {
    pub obligation_id: Pubkey,
    pub owner: Pubkey,
    pub reserve: Pubkey,
    pub accumulated_reward_amount: u64,
    pub last_supply: i64,
    pub initialized: bool,
    pub supply_amount: u64,
}

impl ReserveReward {
    pub const LEN: usize = 8 + 32 + 32 + 32 + 8 + 8 + 1 + 8;
}

#[account]
#[derive(Debug)]
pub struct SupplyAPY {
    pub reserve: Pubkey,
    pub apy: f32,
    pub reward_token: Pubkey,
    pub token_decimals: u8,
    pub initialized: bool,
}

impl SupplyAPY {
    pub const LEN: usize = 8 + 32 + 4 + 32 + 1 + 1;

    pub fn calculate_reward(&self, supply_amount: u64, time: i64) -> u64 {
        let reward = (supply_amount as f32 * self.apy / 365.0 / 24.0 / 60.0 / 60.0 * time as f32) as u64;
        reward
    }
}