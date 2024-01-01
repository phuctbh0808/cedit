use anchor_lang::solana_program::declare_id;

pub use relend_test::ID as RELEND_TEST;
mod relend_test {
    use super::*;
    declare_id!("4JRe6jvgeXCcQwsxQY3StUcwnrCRKrTcWS4pHjtkpWrK");
}

pub use relend::ID as RELEND;
mod relend {
    use super::*;
    declare_id!("2kNzm2v6KR5dpzgavS2nssLV9RxogVP6py2S6doJEfuZ");
}