use anchor_lang::solana_program::declare_id;

pub use relend_test::ID as RELEND_TEST;
mod relend_test {
    use super::*;
    declare_id!("4JRe6jvgeXCcQwsxQY3StUcwnrCRKrTcWS4pHjtkpWrK");
}

pub use relend::ID as RELEND;
mod relend {
    use super::*;
    declare_id!("Gt9oqTVmAwhrjBpS5j4Nc39fr9gCYArWxVXuHHc8QxnJ");
}

pub use relend_program::ID as RELEND_PROGRAM;
mod relend_program {
    use super::*;
    declare_id!("AqR1WSUwNeVsz66ayH2J8iTyiGMgouRwPqzzMaxx49ba");
}

pub use relend_program_test::ID as RELEND_PROGRAM_TEST;
mod relend_program_test {
    use super::*;
    declare_id!("LP17qXm5XnefkyVzkJa8gLcKXnjmsjX3YQCdB18Dsku");
}