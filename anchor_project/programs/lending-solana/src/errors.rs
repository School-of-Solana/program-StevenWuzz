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
    #[msg("The user does not own the provided collateral token account")]
    MismatchedCollateralTokenAccountOwner,
    #[msg("Collateral and loan mints cannnot be the same")]
    IdenticalCollateralAndLoanMints,
    #[msg("Lending market does not have enough tokens in the loan vault to lend out")]
    InsufficientLoanVaultLiquidity,
}
