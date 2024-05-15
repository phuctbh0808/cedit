use anchor_lang::solana_program::declare_id;

pub use relend_test::ID as RELEND_TEST;
mod relend_test {
    use super::*;
    declare_id!("4JRe6jvgeXCcQwsxQY3StUcwnrCRKrTcWS4pHjtkpWrK");
}

pub use relend::ID as RELEND;
mod relend {
    use super::*;
    declare_id!("CN7pLWoBcvQ597tQ7surcMtMBzrD2TaXSrh1CCybu6Mk");
}

pub use relend_program::ID as RELEND_PROGRAM;
mod relend_program {
    use super::*;
    declare_id!("BtdHuy25QeiQg8TkgFyHkFXJbezhNE1tyAC7sAMjzh24");
}

pub use relend_program_test::ID as RELEND_PROGRAM_TEST;
mod relend_program_test {
    use super::*;
    declare_id!("LP17qXm5XnefkyVzkJa8gLcKXnjmsjX3YQCdB18Dsku");
}