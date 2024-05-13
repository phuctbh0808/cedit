use anchor_lang::prelude::*;

use crate::{constants::*, state::*, errors::ReearnErrorCode};

#[derive(Accounts)]
#[instruction(reserve: Pubkey)]
pub struct CloseReserveReward<'info> {
    /// CHECK
    #[account(mut)]
    pub fee_payer: AccountInfo<'info>,
    #[account(
        mut,
        address = config_account.operator @ ReearnErrorCode::WrongOperator,
    )]
    pub authority: Signer<'info>,

    /// CHECK
    #[account(
        mut,
        seeds = [SUPPLY_APY_SEED, reserve.as_ref()],
        bump,
    )]
    pub supply_apy: AccountInfo<'info>,
    #[account(
        mut,
        seeds = [CONFIG_SEED, config_account.admin.as_ref()],
        bump = config_account.bump[0],
    )]
    pub config_account: Account<'info, Config>,
    pub system_program: Program<'info, System>,
}

pub fn exec(ctx: Context<CloseReserveReward>, reserve: Pubkey) -> ProgramResult {
    // We close account manually to ensure backward compatability
    // The code is similar to Anchor code: `https://github.com/coral-xyz/anchor/blob/master/lang/src/common.rs`
    // If we close an account using Anchor, we need to redeploy program 2 times
    let supply_apy = &mut ctx.accounts.supply_apy;
    let fee_payer = &ctx.accounts.fee_payer;
    let dest_starting_lamports = fee_payer.lamports();
    **fee_payer.lamports.borrow_mut() = dest_starting_lamports.checked_add(supply_apy.lamports()).unwrap();
    **supply_apy.lamports.borrow_mut() = 0;

    supply_apy.assign(&System::id());
    supply_apy.realloc(0, false)?;
    Ok(())
}