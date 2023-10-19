use anchor_lang::prelude::*;
use solana_program::pubkey::Pubkey;

const DISCRIMINATOR_LEN: u64 = 32;

#[allow(missing_docs)]
#[derive(AnchorSerialize, AnchorDeserialize, Debug, Clone, Copy, PartialEq)]
pub enum ProductStatus {
    Unknown,
    Offline,
    Online,
}


#[allow(missing_docs)]
#[derive(AnchorSerialize, AnchorDeserialize, Debug, Clone, Copy, PartialEq)]
pub enum AssetType {
    Forex,
    Crypto,
}

#[allow(missing_docs)]
#[derive(Debug, Clone, PartialEq)]
pub struct Product {
    pub version: u16,
    pub status: ProductStatus,
    pub asset_type: AssetType,

    pub quote_currency: String,
    pub quote_mint: Pubkey,
    pub base_currency: String,
    pub base_mint: Pubkey,

    pub price_account: Pubkey,
    pub expo: i32,
    pub max_price: u64,
    pub min_price: u64,
    pub window_size: u64,
    pub controller: Pubkey,
    pub bump: [u8; 1],
}

impl AnchorDeserialize for Product {
    fn deserialize(buf: &mut &[u8]) -> std::io::Result<Self> {
        let mut data: &[u8] = &buf[8..];
        match AnchorDeserialize::deserialize(&mut data) {
            Ok(rv) => Ok(rv),
            Err(err) => {
                Err(std::io::Error::new(std::io::ErrorKind::InvalidData, format!("Deserialization error: {}", err)))
            }
        }
    }
}

#[allow(missing_docs)]
#[derive(AnchorSerialize, AnchorDeserialize, Debug, Clone, Copy, PartialEq)]
pub enum PriceStatus {
    Unknown,
    Offline,
    Online,
}

#[allow(missing_docs)]
#[derive(Clone, Debug, PartialEq)]
pub struct Price {
    pub version: u16,
    pub status: PriceStatus,
    pub product_account: Pubkey,

    pub price: u64,
    pub num_publishers: u16,
    pub timestamp: u64,

    pub prev_price: u64,
    pub prev_timestamp: u64,
    pub bump: [u8; 1],
}

impl AnchorDeserialize for Price {
    fn deserialize(buf: &mut &[u8]) -> std::io::Result<Self> {
        let mut data: &[u8] = &buf[8..];
        match AnchorDeserialize::deserialize(&mut data) {
            Ok(rv) => Ok(rv),
            Err(err) => {
                Err(std::io::Error::new(std::io::ErrorKind::InvalidData, format!("Deserialization error: {}", err)))
            }
        }
    }
}
