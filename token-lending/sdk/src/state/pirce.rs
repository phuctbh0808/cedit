use borsh_derive::BorshDeserialize;
use solana_program::pubkey::Pubkey;


#[derive(BorshDeserialize, Debug, PartialEq)]
/// Asset Type
pub enum AssetType {
    /// Forex
    Forex,
    /// Crypto
    Crypto,
}

#[derive(BorshDeserialize, Debug, PartialEq)]
/// Product Status
pub enum ProductStatus {
    /// Unknown
    Unknown,
    /// Offline
    Offline,
    /// Online
    Online,
}

#[derive(BorshDeserialize, Debug)]
/// Product
pub struct Product {
    /// Version
    pub version: u16,           
    /// Product Status, size = 1
    pub status: ProductStatus,
    /// Asset Type, size = 1
    pub asset_type: AssetType,

    /// Quote currence, e.g: USD; STR_MAX_LEN
    pub quote_currency: String,
    /// Quote mint
    pub quote_mint: Pubkey,   
    /// Base currency, e.g: VND; STR_MAX_LEN
    pub base_currency: String,
    /// Base mint
    pub base_mint: Pubkey,   

    /// Price account
    pub price_account: Pubkey,
    /// Expo
    pub expo: i32,
    /// Max price, e.g: price: 2546734 and expo: -2 => represents: 25467,34 (price * 10^(expo))
    pub max_price: u64,
    /// Min price
    pub min_price: u64,
    /// Window size
    pub window_size: u64,
    /// Controller
    pub controller: Pubkey,
    /// Bump
    pub bump: [u8; 1],
}

#[derive(BorshDeserialize, Debug, PartialEq)]
/// Price Status
pub enum PriceStatus {
    /// Unknow
    Unknown,
    /// Offline
    Offline,
    /// Online
    Online,
}

#[derive(BorshDeserialize, Debug)]
/// Price
pub struct Price {
    /// Version
    pub version: u16,
    /// Price status
    pub status: PriceStatus,
    /// Product Account
    pub product_account: Pubkey,

    /// Price
    pub price: u64,
    /// Num Publishers
    pub num_publishers: u16,
    /// Timestamp
    pub timestamp: u64,

    /// Prev price
    pub prev_price: u64,
    /// Prev timestamp
    pub prev_timestamp: u64,
    /// Bump
    pub bump: [u8; 1],
}