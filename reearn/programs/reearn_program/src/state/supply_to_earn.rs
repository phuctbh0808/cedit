use anchor_lang::prelude::*;

#[account]
pub struct ReserveReward {
    pub obligation_id: Pubkey,
    pub owner: Pubkey,
    pub reserve: Pubkey,
    pub accumulated_reward_amount: f64,
    pub last_supply: i64,
    pub initialized: bool,
}

impl ReserveReward {
    pub const LEN: usize = 8 + 32 + 32 + 32 + 8 + 8 + 1;
}

#[account]
#[derive(Debug)]
pub struct SupplyApy {
    pub reserve: Pubkey,
    pub apy: f32, 
    pub reward_token: Pubkey,
    pub token_decimals: u8,
    pub initialized: bool,
}

impl SupplyApy {
    pub const LEN: usize = 8 + 32 + 4 + 32 + 1 + 1;

    pub fn calculate_reward(&self, supply_amount: u64, duration: i64) -> f64 {
        let time_diff_years = (duration as f64) / 31536000_f64; // 60*60*24*365
        let principal = supply_amount as f64;
        let compound_interest = (self.apy + 1.0) as f64;
        let earnings = principal * compound_interest*time_diff_years;
        earnings
    }
}
