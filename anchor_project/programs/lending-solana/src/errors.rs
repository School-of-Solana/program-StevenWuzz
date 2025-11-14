use anchor_lang::prelude::*;

#[error_code]
pub enum LendingError {
    #[msg("User's collateral amount has overflowed")]
    UserCollateralOverflow,
    #[msg("User's borrow amount has overflowed")]
    UserBorrowOverflow,
    #[msg("Lending market's borrow amount has overflowed")]
    MarketBorrowOverflow,
    #[msg("User's total borrow amount will exceed the maximum allowable borrow")]
    UserMaxBorrowExceeded,
    #[msg("Lending market's total collateral has overflowed")]
    MarketCollateralOverflow,
    #[msg("The provided collateral vault does not match the lending market's collateral vault")]
    MismatchedCollateralVault,
    #[msg("The provided collateral mint does not match the lending market's collateral mint")]
    MistmatchedCollateralMint,
    #[msg("The provided loan vault does not match the lending market's loan vault")]
    MismatchedLoanVault,
}