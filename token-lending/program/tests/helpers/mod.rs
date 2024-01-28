#![allow(dead_code)]

use relend_program::state::{InitLendingMarketParams, LendingMarket};
use solana_program::{program_pack::Pack, pubkey::Pubkey};
use solana_program_test::*;
use solana_sdk::{
    account::Account,
    signature::{read_keypair_file, Keypair, Signer},
};

pub const QUOTE_CURRENCY: [u8; 32] =
    *b"USD\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0";
pub const LAMPORTS_TO_SOL: u64 = 1_000_000_000;
pub const FRACTIONAL_TO_USDC: u64 = 1_000_000;

trait AddPacked {
    fn add_packable_account<T: Pack>(
        &mut self,
        pubkey: Pubkey,
        amount: u64,
        data: &T,
        owner: &Pubkey,
    );
}

impl AddPacked for ProgramTest {
    fn add_packable_account<T: Pack>(
        &mut self,
        pubkey: Pubkey,
        amount: u64,
        data: &T,
        owner: &Pubkey,
    ) {
        let mut account = Account::new(amount, T::get_packed_len(), owner);
        data.pack_into_slice(&mut account.data);
        self.add_account(pubkey, account);
    }
}

pub fn add_lending_market(test: &mut ProgramTest) -> TestLendingMarket {
    let lending_market_pubkey = Pubkey::new_unique();
    let (lending_market_authority, bump_seed) =
        Pubkey::find_program_address(&[lending_market_pubkey.as_ref()], &relend_program::id());

    let lending_market_owner =
        read_keypair_file("tests/fixtures/lending_market_owner.json").unwrap();
    let oracle_program_id = read_keypair_file("tests/fixtures/oracle_program_id.json")
        .unwrap()
        .pubkey();

    test.add_packable_account(
        lending_market_pubkey,
        u32::MAX as u64,
        &LendingMarket::new(InitLendingMarketParams {
            bump_seed,
            owner: lending_market_owner.pubkey(),
            quote_currency: QUOTE_CURRENCY,
            token_program_id: spl_token::id(),
            oracle_program_id,
            second_oracle_program_id: oracle_program_id,
        }),
        &relend_program::id(),
    );

    TestLendingMarket {
        pubkey: lending_market_pubkey,
        owner: lending_market_owner,
        authority: lending_market_authority,
        quote_currency: QUOTE_CURRENCY,
        oracle_program_id,
        switchboard_oracle_program_id: oracle_program_id,
    }
}

pub struct TestLendingMarket {
    pub pubkey: Pubkey,
    pub owner: Keypair,
    pub authority: Pubkey,
    pub quote_currency: [u8; 32],
    pub oracle_program_id: Pubkey,
    pub switchboard_oracle_program_id: Pubkey,
}

impl TestLendingMarket {
    pub async fn get_state(&self, banks_client: &mut BanksClient) -> LendingMarket {
        let lending_market_account: Account = banks_client
            .get_account(self.pubkey)
            .await
            .unwrap()
            .unwrap();
        LendingMarket::unpack(&lending_market_account.data[..]).unwrap()
    }
}
