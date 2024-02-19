use anchor_lang::prelude::*;

#[error]
#[derive(PartialEq)]
pub enum ReearnErrorCode {
    #[msg("Only admin")]
    OnlyAdmin,
    #[msg("Wrong Operator")]
    WrongOperator,
    #[msg("Invalid lock duration")]
    InvalidLockDuration,
    #[msg("Positive exponent is not supported")]
    ExpoPositiveNonSupport,
    #[msg("Math operation overflow")]
    MathOverflow,
    #[msg("Wrong obligation")]
    WrongObligation,
    #[msg("Wrong wallet")]
    WrongWallet,
    #[msg("Wrong reward owner")]
    WrongRewardOwner,
    #[msg("Already claimed today")]
    AlreadyClaimedToday,
    #[msg("Wrong reserve")]
    WrongReserve,
    #[msg("Wrong reward token")]
    WrongRewardToken,
    #[msg("Invalid account owner")]
    InvalidAccountOwner,
}