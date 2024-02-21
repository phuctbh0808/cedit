use anchor_lang::prelude::*;
use relend_sdk::math::*;

#[account]
pub struct ReserveReward {
    pub obligation_id: Pubkey,
    pub owner: Pubkey,
    pub reserve: Pubkey,
    pub accumulated_reward_amount: u64,
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

    pub fn calculate_reward(&self, supply_amount: u64, supply_decimals: u32, duration: i64) -> Result<u64, ProgramError> {
        let supply_amount = Decimal::from(supply_amount)
        .try_div(10u64.pow(supply_decimals))?;
        let apy_percentage = (self.apy * 100.0) as u64;
        let earnings = supply_amount
        .try_mul(apy_percentage)?
        .try_mul(duration as u64)?
        .try_div(3153600)? // 60*60*24*365
        .try_div(100)? // percentage
        .try_mul(10u64.pow(self.token_decimals as u32))?
        .try_floor_u64()?;
        Ok(earnings)
    }
}
