#![deny(missing_docs)]

//! A lending program for the Solana blockchain.

pub mod error;
pub mod instruction;
pub mod math;
pub mod oracles;
pub mod state;

// Export current sdk types for downstream users building with a different sdk version
pub use solana_program;

/// mainnet program id
pub mod relend_mainnet {
    solana_program::declare_id!("CcCHrm4LNwUSYUXugnVnepfPf9FtHX7Dtdwth2Mj7CCJ");
}

/// devnet program id
pub mod relend_devnet {
    solana_program::declare_id!("CcCHrm4LNwUSYUXugnVnepfPf9FtHX7Dtdwth2Mj7CCJ");
}

/// Canonical null pubkey. Prints out as "nu11111111111111111111111111111111111111111"
pub const NULL_PUBKEY: solana_program::pubkey::Pubkey =
    solana_program::pubkey::Pubkey::new_from_array([
        11, 193, 238, 216, 208, 116, 241, 195, 55, 212, 76, 22, 75, 202, 40, 216, 76, 206, 27, 169,
        138, 64, 177, 28, 19, 90, 156, 0, 0, 0, 0, 0,
    ]);

/// RENEC price oracle pubkey
pub const RENEC: &str = "GKQkHhzpDqyQ3AKaoo3ADcFjV6oFLv7Xf7Ut4dKyxtHj";
/// reBTC price oracle pubkey
pub const REBTC: &str = "F7jKoXmoBGrTvEPj2PaD4XQc835ZQAu2eXWSNAGCzJUu";
/// reETH price oracle pubkey
pub const REETH: &str = "8Qia1nicPBG4TwksAVvzXn2GA5iosB3Q51zA121Xk4Bj";

/// Mainnet program id for Switchboard v2.
pub mod switchboard_v2_mainnet {
    solana_program::declare_id!("SW1TCH7qEPTdLsDHRgPuMQjbQxKdH2aBStViMFnt64f");
}

/// Devnet program id for Switchboard v2.
pub mod switchboard_v2_devnet {
    solana_program::declare_id!("2TfB33aLaneQb5TNVwyDz3jSZXS6jdW2ARw1Dgf84XCG");
}
