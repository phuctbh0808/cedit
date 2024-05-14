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
    pub start_time: i64,
    pub end_time: i64,
    pub initialized: bool,
    pub _reserve_space: [u128; 6],
}

impl SupplyApy {
    pub const LEN: usize = 8 + 32 + 4 + 32 + 1 + 8 * 2 + 1 + 16 * 6;

    pub fn calculate_reward(&self, supply_amount: u64, supply_decimals: u32, current_time: i64, last_supply: i64) -> Result<u64, ProgramError> {
        let duration = self.calculate_duration(current_time, last_supply);
        let supply_amount = Decimal::from(supply_amount)
        .try_div(10u64.pow(supply_decimals))?;
        let apy_percentage = (self.apy * 100.0) as u64;
        let earnings = supply_amount
        .try_mul(apy_percentage)?
        .try_mul(duration as u64)?
        .try_div(31536000)? // 60*60*24*365
        .try_div(100)? // percentage
        .try_mul(10u64.pow(self.token_decimals as u32))?
        .try_floor_u64()?;
        Ok(earnings)
    }

    fn calculate_duration(&self, current_time: i64, last_supply: i64) -> i64 {
        if current_time < self.start_time {
            // No reward before start_time
            0
        } else if current_time <= self.end_time {
            // last_supply >= start_time => Reward is accumulated from last_supply to current_time
            // last_supply < start_time => Reward is accumulated from start_time to current_time
            current_time - last_supply.max(self.start_time)
        } else { // current_time > self.end_time
            if last_supply < self.start_time {
                // last_supply < start_time => Reward is accumulated from start_time to end_time
                self.end_time - self.start_time
            } else {
                // last_supply > end_time => Reward is accumulated from min(last_supply, end_time) to end_time
                self.end_time - last_supply.min(self.end_time)
            }
        }
    }
}

#[test]
pub fn test_calculate_reward() {
    let supply_apy = SupplyApy {
        reserve: Default::default(),
        apy: 3.4,
        reward_token: Default::default(),
        token_decimals: 6,
        start_time: 1000,
        end_time: 2000,
        initialized: true,
        _reserve_space: [0, 0, 0, 0, 0, 0],
    };

    let supply_amount = 100000;
    let before_start_time_earning = supply_apy.calculate_reward(supply_amount, 6, 900, 0).unwrap();
    assert_eq!(before_start_time_earning, 0);
    let inside_earning = supply_apy.calculate_reward(supply_amount, 6, 1500, 0).unwrap();
    assert_eq!(inside_earning, 5);
    let outside_earning_1 = supply_apy.calculate_reward(supply_amount, 6, 2500, 1500).unwrap();
    assert_eq!(outside_earning_1, 5);
    let outside_earning_2 = supply_apy.calculate_reward(supply_amount, 6, 2500, 2001).unwrap();
    assert_eq!(outside_earning_2, 0);
    let outside_earning_3 = supply_apy.calculate_reward(supply_amount, 6, 2500, 500).unwrap();
    assert_eq!(outside_earning_3, 10);
}
