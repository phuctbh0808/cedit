#![allow(missing_docs)]
use crate::{
    self as relend_program,
    error::LendingError,
    math::{Decimal, TryDiv},
    state::{Price, PriceStatus, Product, ProductStatus},
};
use anchor_lang::require;
use borsh::BorshDeserialize;
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

pub fn get_oracle_price(
    price_info: &AccountInfo,
    price_product: &AccountInfo,
    clock: &Clock,
) -> Result<(Decimal, Decimal), ProgramError> {
    // Default price will be 1 which apply for all stable coin
    let mut price_calculator = PriceCalculator::new(1000000, -6)?;
    let price_key = price_info.key.to_string();

    if price_key != relend_program::REUSD {
        msg!("It is not reUSD");
        const STALE_AFTER_SLOTS_ELAPSED: u64 = 60;

        let product_data: &[u8] = &price_product.try_borrow_data()?;
        let mut oracle_product_data: &[u8] = &product_data[8..];
        let oracle_product_info: Product = BorshDeserialize::deserialize(&mut oracle_product_data)
            .unwrap_or_else(|error| {
                msg!("Product deserialize error: {:?}", error);
                Product::default()
            });
        
        require!(
            oracle_product_info.price_account.eq(&price_info.key),
            LendingError::InvalidPriceOfProductOracle
        );

        if *price_info.key == relend_program::NULL_PUBKEY {
            return Err(LendingError::NullOracleConfig.into());
        }

        require!(
            oracle_product_info.status == ProductStatus::Online,
            LendingError::UnavailableProduct
        );

        let price_data: &[u8] = &price_info.try_borrow_data()?;
        let mut oracle_price_data: &[u8] = &price_data[8..];
        let oracle_price_info: Price = BorshDeserialize::deserialize(&mut oracle_price_data)
            .unwrap_or_else(|error| {
                msg!("Price deserialize error: {:?}", error);
                Price::default()
            });

        require!(
            oracle_price_info.status == PriceStatus::Online,
            LendingError::UnavailablePriceInfo
        );
        let now = to_timestamp_u64(clock.unix_timestamp)?;
        // price must be not older than over 60s
        require!(
            now - STALE_AFTER_SLOTS_ELAPSED <= oracle_price_info.timestamp,
            LendingError::PriceTooOld
        );

        // 24_500_000_000, expo = -6
        price_calculator = PriceCalculator::new(oracle_price_info.price, oracle_product_info.expo)?;
    }

    let is_reverse_pair = price_key == relend_program::REUSD_REVND || price_key == relend_program::REUSD_RENGN;
    let market_price = price_calculator_to_decimal(&price_calculator, is_reverse_pair);
    let ema_price = market_price.clone()?;
    Ok((market_price?, ema_price))
}

fn to_timestamp_u64(t: i64) -> Result<u64, LendingError> {
    u64::try_from(t).or(Err(LendingError::InvalidTimestampConversion))
}

fn price_calculator_to_decimal(price_calculator: &PriceCalculator, is_reverse: bool) -> Result<Decimal, ProgramError> {
    let price: u64 = price_calculator.price.try_into().map_err(|_| {
        msg!("Oracle price cannot be negative");
        LendingError::InvalidOracleConfig
    })?;

    let exponent = price_calculator
        .expo
        .checked_abs()
        .ok_or(LendingError::MathOverflow)?
        .try_into()
        .map_err(|_| LendingError::MathOverflow)?;
    let decimals = 10u64
        .checked_pow(exponent)
        .ok_or(LendingError::MathOverflow)?;
    if is_reverse {
        msg!("Get reverse price");
        Decimal::from(decimals).try_div(price)
    } else {
        Decimal::from(price).try_div(decimals)
    }
}

