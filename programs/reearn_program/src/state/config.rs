use crate::*;

#[account]
pub struct Config {
    pub bump: [u8; 1],
    pub vault_bump: [u8; 1],
    pub admin: Pubkey,
    pub operator: Pubkey,
    pub lock_duration: u32,
    pub max_reward_per_obligation: u8,
}

impl Config {
    pub const LEN: usize = 8 + 1 + 1 + 32 + 32 + 4 + 1;

    pub fn init(
        &mut self,
        bump: u8,
        vault_bump: u8,
        admin: Pubkey,
        operator: Pubkey,
    ) -> ProgramResult {
        self.bump = [bump];
        self.vault_bump = [vault_bump];
        self.admin = admin;
        self.operator = operator;
        self.lock_duration = 86400; // 1 day
        self.max_reward_per_obligation = 3;
        Ok(())
    }

    pub fn change_operator(&mut self, operator: Pubkey) -> ProgramResult {
        self.operator = operator;

        Ok(())
    }

    pub fn change_lock_duration(&mut self, lock_duration: u32) -> ProgramResult {
        self.lock_duration = lock_duration;

        Ok(())
    }
}
