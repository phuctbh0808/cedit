use crate::{constants::*, errors::ReearnErrorCode, state::*};
use anchor_lang::prelude::*;

#[derive(Accounts)]
#[instruction(reserve: Pubkey)]
pub struct InitReserveReward<'info> {
    #[account(mut)]
    pub fee_payer: Signer<'info>,
    #[account(
        mut,
        address = config_account.operator @ ReearnErrorCode::WrongOperator,
    )]
    pub authority: Signer<'info>,
    #[account(
        init,
        seeds = [SUPPLY_APY_SEED, reserve.as_ref()],
        bump,
        payer = authority,
        space = SupplyAPY::LEN,
    )]
    pub supply_apy: Account<'info, SupplyAPY>,
    #[account(
        mut,
        seeds = [CONFIG_SEED, config_account.admin.as_ref()],
        bump = config_account.bump[0],
    )]
    pub config_account: Account<'info, Config>,
    #[account(
        init,
        owner = supply_apy.key(),
        seeds = [VAULT_SEED, supply_apy.key().as_ref()],
        bump,
        payer = fee_payer,
        space = 0,
    )]
    /// CHECK: general account for vault
    pub vault: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn exec(ctx: Context<InitReserveReward>, reserve: Pubkey, reward: Pubkey, apy: f32, token_decimals: u8) -> ProgramResult {
    let supply_apy = &mut ctx.accounts.supply_apy;
    supply_apy.init(reserve, reward, apy, token_decimals);

    Ok(())
}