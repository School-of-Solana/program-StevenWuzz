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
    #[msg("The lending market does not own the provided collateral vault")]
    MismatchedCollateralVaultOwner,
    #[msg("The provided collateral mint does not match the lending market's collateral mint")]
    MistmatchedCollateralMint,
    #[msg("The lending market does not own the provided loan vault")]
    MismatchedLoanVaultOwner,
    #[msg("Collateral and loan mints cannnot be the same")]
    IdenticalCollateralAndLoanMints,
}