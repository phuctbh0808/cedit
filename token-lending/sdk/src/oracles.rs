#![allow(missing_docs)]
use crate::{
    self as relend_program,
    error::LendingError,
    math::{Decimal, TryDiv},
};
use anchor_lang::require;
use solana_program::{
    account_info::AccountInfo, msg, program_error::ProgramError, sysvar::clock::Clock,
};
use std::{convert::TryInto, result::Result};

pub type UnixTimestamp = i64;

pub struct PriceCalculator {
    pub price: u64,
    pub expo: i32,
}

impl PriceCalculator {
    pub fn new(price: u64, expo: i32) -> Result<Self, ProgramError> {
        require!(expo <= 0, LendingError::ExpoPositiveNonSupport);

        Ok(Self { price, expo })
    }
}

pub fn get_pyth_price(
    price_info: &AccountInfo,
    _: &Clock,
) -> Result<(Decimal, Decimal), ProgramError> {
    // const STALE_AFTER_SLOTS_ELAPSED: u64 = 60;

    // let mut oracle_product_data: &[u8] = &price_product.try_borrow_data()?;
    // let oracle_product_info = Product::deserialize(&mut oracle_product_data)?;
    // require!(
    //     oracle_product_info.price_account.eq(&price_info.key),
    //     LendingError::InvalidPriceOfProductOracle
    // );

    // if *price_info.key == relend_program::NULL_PUBKEY {
    //     return Err(LendingError::NullOracleConfig.into());
    // }

    // require!(
    //     oracle_product_info.status == ProductStatus::Online,
    //     LendingError::UnavailableProduct
    // );

    // let mut oracle_price_data: &[u8] = &price_info.try_borrow_data()?;
    // let oracle_price_info = Price::deserialize(&mut oracle_price_data)?;

    // require!(
    //     oracle_price_info.status == PriceStatus::Online,
    //     LendingError::UnavailablePriceInfo
    // );

    // let now = to_timestamp_u64(clock.unix_timestamp)?;
    // // price must be not older than over 60s
    // require!(
    //     now - STALE_AFTER_SLOTS_ELAPSED <= oracle_price_info.timestamp,
    //     LendingError::PriceTooOld
    // );
    

    let mut price_calculator = PriceCalculator::new(1000000, -6)?;
    let price_key = price_info.key.to_string();
    if price_key == relend_program::REBTC {
        price_calculator = PriceCalculator::new(34506351520, -6)?;
    } else if price_key == relend_program::REETH {
        price_calculator = PriceCalculator::new(1809663999, -6)?;
    } else if price_key == relend_program::RENEC {
        price_calculator = PriceCalculator::new(321909, -6)?;
    } 

    let market_price = price_calculator_to_decimal(&price_calculator);
    let ema_price = market_price.clone()?;

    Ok((market_price?, ema_price))
}

// fn to_timestamp_u64(t: i64) -> Result<u64, LendingError> {
//     u64::try_from(t).or(Err(LendingError::InvalidTimestampConversion))
// }

fn price_calculator_to_decimal(pyth_price: &PriceCalculator) -> Result<Decimal, ProgramError> {
    let price: u64 = pyth_price.price.try_into().map_err(|_| {
        msg!("Oracle price cannot be negative");
        LendingError::InvalidOracleConfig
    })?;

    let exponent = pyth_price
        .expo
        .checked_abs()
        .ok_or(LendingError::MathOverflow)?
        .try_into()
        .map_err(|_| LendingError::MathOverflow)?;
    let decimals = 10u64
        .checked_pow(exponent)
        .ok_or(LendingError::MathOverflow)?;
    Decimal::from(price).try_div(decimals)
}

// #[cfg(test)]
// mod test {
//     use super::*;
//     use bytemuck::bytes_of_mut;
//     use proptest::prelude::*;
//     use pyth_sdk_solana::state::Rational;
//     use pyth_sdk_solana::state::{
//         AccountType, CorpAction, PriceAccount, PriceInfo, PriceStatus, PriceType, MAGIC, VERSION_2,
//     };
//     use solana_program::pubkey::Pubkey;

//     #[derive(Clone, Debug)]
//     struct PythPriceTestCase {
//         price_account: PriceAccount,
//         clock: Clock,
//         expected_result: Result<(Decimal, Decimal), ProgramError>,
//     }

//     fn pyth_price_cases() -> impl Strategy<Value = PythPriceTestCase> {
//         prop_oneof![
//             // case 2: failure. bad magic value
//             Just(PythPriceTestCase {
//                 price_account: PriceAccount {
//                     magic: MAGIC + 1,
//                     ver: VERSION_2,
//                     atype: AccountType::Price as u32,
//                     ptype: PriceType::Price,
//                     expo: 10,
//                     ema_price: Rational {
//                         val: 11,
//                         numer: 110,
//                         denom: 10,
//                     },
//                     agg: PriceInfo {
//                         price: 10,
//                         conf: 1,
//                         status: PriceStatus::Trading,
//                         corp_act: CorpAction::NoCorpAct,
//                         pub_slot: 0
//                     },
//                     ..PriceAccount::default()
//                 },
//                 clock: Clock {
//                     slot: 4,
//                     ..Clock::default()
//                 },
//                 // PythError::InvalidAccountData.
//                 expected_result: Err(LendingError::InvalidOracleConfig.into()),
//             }),
//             // case 3: failure. bad version number
//             Just(PythPriceTestCase {
//                 price_account: PriceAccount {
//                     magic: MAGIC,
//                     ver: VERSION_2 - 1,
//                     atype: AccountType::Price as u32,
//                     ptype: PriceType::Price,
//                     expo: 10,
//                     ema_price: Rational {
//                         val: 11,
//                         numer: 110,
//                         denom: 10,
//                     },
//                     agg: PriceInfo {
//                         price: 10,
//                         conf: 1,
//                         status: PriceStatus::Trading,
//                         corp_act: CorpAction::NoCorpAct,
//                         pub_slot: 0
//                     },
//                     ..PriceAccount::default()
//                 },
//                 clock: Clock {
//                     slot: 4,
//                     ..Clock::default()
//                 },
//                 expected_result: Err(LendingError::InvalidOracleConfig.into()),
//             }),
//             // case 4: failure. bad account type
//             Just(PythPriceTestCase {
//                 price_account: PriceAccount {
//                     magic: MAGIC,
//                     ver: VERSION_2,
//                     atype: AccountType::Product as u32,
//                     ptype: PriceType::Price,
//                     expo: 10,
//                     ema_price: Rational {
//                         val: 11,
//                         numer: 110,
//                         denom: 10,
//                     },
//                     agg: PriceInfo {
//                         price: 10,
//                         conf: 1,
//                         status: PriceStatus::Trading,
//                         corp_act: CorpAction::NoCorpAct,
//                         pub_slot: 0
//                     },
//                     ..PriceAccount::default()
//                 },
//                 clock: Clock {
//                     slot: 4,
//                     ..Clock::default()
//                 },
//                 expected_result: Err(LendingError::InvalidOracleConfig.into()),
//             }),
//             // case 5: ignore. bad price type is fine. not testing this
//             // case 6: success. most recent price has status == trading, not stale
//             Just(PythPriceTestCase {
//                 price_account: PriceAccount {
//                     magic: MAGIC,
//                     ver: VERSION_2,
//                     atype: AccountType::Price as u32,
//                     ptype: PriceType::Price,
//                     expo: 1,
//                     timestamp: 0,
//                     ema_price: Rational {
//                         val: 11,
//                         numer: 110,
//                         denom: 10,
//                     },
//                     agg: PriceInfo {
//                         price: 200,
//                         conf: 1,
//                         status: PriceStatus::Trading,
//                         corp_act: CorpAction::NoCorpAct,
//                         pub_slot: 0
//                     },
//                     ..PriceAccount::default()
//                 },
//                 clock: Clock {
//                     slot: 240,
//                     ..Clock::default()
//                 },
//                 expected_result: Ok((Decimal::from(2000_u64), Decimal::from(110_u64)))
//             }),
//             // case 7: success. most recent price has status == unknown, previous price not stale
//             Just(PythPriceTestCase {
//                 price_account: PriceAccount {
//                     magic: MAGIC,
//                     ver: VERSION_2,
//                     atype: AccountType::Price as u32,
//                     ptype: PriceType::Price,
//                     expo: 1,
//                     timestamp: 20,
//                     ema_price: Rational {
//                         val: 11,
//                         numer: 110,
//                         denom: 10,
//                     },
//                     agg: PriceInfo {
//                         price: 200,
//                         conf: 1,
//                         status: PriceStatus::Unknown,
//                         corp_act: CorpAction::NoCorpAct,
//                         pub_slot: 1
//                     },
//                     prev_price: 190,
//                     prev_conf: 10,
//                     prev_slot: 0,
//                     ..PriceAccount::default()
//                 },
//                 clock: Clock {
//                     slot: 240,
//                     ..Clock::default()
//                 },
//                 expected_result: Ok((Decimal::from(1900_u64), Decimal::from(110_u64)))
//             }),
//             // case 8: failure. most recent price is stale
//             Just(PythPriceTestCase {
//                 price_account: PriceAccount {
//                     magic: MAGIC,
//                     ver: VERSION_2,
//                     atype: AccountType::Price as u32,
//                     ptype: PriceType::Price,
//                     expo: 1,
//                     timestamp: 0,
//                     ema_price: Rational {
//                         val: 11,
//                         numer: 110,
//                         denom: 10,
//                     },
//                     agg: PriceInfo {
//                         price: 200,
//                         conf: 1,
//                         status: PriceStatus::Trading,
//                         corp_act: CorpAction::NoCorpAct,
//                         pub_slot: 1
//                     },
//                     prev_slot: 0, // there is no case where prev_slot > agg.pub_slot
//                     ..PriceAccount::default()
//                 },
//                 clock: Clock {
//                     slot: 242,
//                     ..Clock::default()
//                 },
//                 expected_result: Err(LendingError::InvalidOracleConfig.into())
//             }),
//             // case 9: failure. most recent price has status == unknown and previous price is stale
//             Just(PythPriceTestCase {
//                 price_account: PriceAccount {
//                     magic: MAGIC,
//                     ver: VERSION_2,
//                     atype: AccountType::Price as u32,
//                     ptype: PriceType::Price,
//                     expo: 1,
//                     timestamp: 1,
//                     ema_price: Rational {
//                         val: 11,
//                         numer: 110,
//                         denom: 10,
//                     },
//                     agg: PriceInfo {
//                         price: 200,
//                         conf: 1,
//                         status: PriceStatus::Unknown,
//                         corp_act: CorpAction::NoCorpAct,
//                         pub_slot: 1
//                     },
//                     prev_price: 190,
//                     prev_conf: 10,
//                     prev_slot: 0,
//                     ..PriceAccount::default()
//                 },
//                 clock: Clock {
//                     slot: 241,
//                     ..Clock::default()
//                 },
//                 expected_result: Err(LendingError::InvalidOracleConfig.into())
//             }),
//             // case 10: failure. price is negative
//             Just(PythPriceTestCase {
//                 price_account: PriceAccount {
//                     magic: MAGIC,
//                     ver: VERSION_2,
//                     atype: AccountType::Price as u32,
//                     ptype: PriceType::Price,
//                     expo: 1,
//                     timestamp: 1,
//                     ema_price: Rational {
//                         val: 11,
//                         numer: 110,
//                         denom: 10,
//                     },
//                     agg: PriceInfo {
//                         price: -200,
//                         conf: 1,
//                         status: PriceStatus::Trading,
//                         corp_act: CorpAction::NoCorpAct,
//                         pub_slot: 0
//                     },
//                     ..PriceAccount::default()
//                 },
//                 clock: Clock {
//                     slot: 240,
//                     ..Clock::default()
//                 },
//                 expected_result: Err(LendingError::InvalidOracleConfig.into())
//             }),
//             // case 11: failure. confidence interval is too wide
//             Just(PythPriceTestCase {
//                 price_account: PriceAccount {
//                     magic: MAGIC,
//                     ver: VERSION_2,
//                     atype: AccountType::Price as u32,
//                     ptype: PriceType::Price,
//                     expo: 1,
//                     timestamp: 1,
//                     ema_price: Rational {
//                         val: 11,
//                         numer: 110,
//                         denom: 10,
//                     },
//                     agg: PriceInfo {
//                         price: 200,
//                         conf: 40,
//                         status: PriceStatus::Trading,
//                         corp_act: CorpAction::NoCorpAct,
//                         pub_slot: 0
//                     },
//                     ..PriceAccount::default()
//                 },
//                 clock: Clock {
//                     slot: 240,
//                     ..Clock::default()
//                 },
//                 expected_result: Err(LendingError::InvalidOracleConfig.into())
//             }),
//         ]
//     }

//     proptest! {
//         #[test]
//         fn test_pyth_price(mut test_case in pyth_price_cases()) {
//             // wrap price account into an account info
//             let mut lamports = 20;
//             let pubkey = Pubkey::new_unique();
//             let account_info = AccountInfo::new(
//                 &pubkey,
//                 false,
//                 false,
//                 &mut lamports,
//                 bytes_of_mut(&mut test_case.price_account),
//                 &pubkey,
//                 false,
//                 0,
//             );

//             let result = get_pyth_price(&account_info, &test_case.clock);
//             assert_eq!(
//                 result,
//                 test_case.expected_result,
//                 "actual: {:#?} expected: {:#?}",
//                 result,
//                 test_case.expected_result
//             );
//         }
//     }
// }