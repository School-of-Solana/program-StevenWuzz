use anchor_lang::prelude::*;

pub const INTEREST_RATE_BPS: u16 = 500;
pub const COLLATERAL_RATIO_BPS: u16 = 12000;

pub const LENDING_MARKET_SEED: &[u8] = b"lending-market-v2";
pub const COLLATERAL_MINT_SEED: &[u8] = b"collateral-mint-v2";
pub const COLLATERAL_VAULT_SEED: &[u8] = b"collateral-vault-v2";
pub const LOAN_MINT_SEED: &[u8] = b"loan-mint-v2";
pub const LOAN_VAULT_SEED: &[u8] = b"loan-vault-v2";
pub const USER_ACCOUNT_SEED: &[u8] = b"user-account-v2";

#[account]
pub struct LendingMarket {
    pub authority: Pubkey, // Admin/initializer authorized to manage the market
    pub collateral_mint: Pubkey, // Token mint accepted as collateral
    pub loan_mint: Pubkey, // Token mint used for loans
    pub collateral_vault: Pubkey, // PDA token account holding the deposited collateral
    pub loan_vault: Pubkey, // PDA token account holding the available loan liquidity
    pub interest_rate_bps: u16, // Fixed annual interest rate in basis points (e.g., 500 = 5%)
    pub collateral_ratio_bps: u16, // Required collateralization ratio in basis points (e.g., 12000 = 120%)
    pub collateral_amount: u64,    // Total collateral deposited into the market
    pub borrowed_amount: u64,      // Total amount borrowed from the market
    pub bump: u8,                  // PDA bump seed for the lending market account
}

impl LendingMarket {
    pub const LEN: usize = 8 // Anchor discriminator
        + 32 // authority
        + 32 // collateral_mint
        + 32 // loan_mint
        + 32 // collateral_vault
        + 32 // loan_vault
        + 2 // interest_rate_bps
        + 2 // collateral_ratio_bps
        + 8 // collateral_amount
        + 8 // borrowed_amount
        + 1; // bump
}

#[account]
pub struct UserAccount {
    pub user: Pubkey,                     // Owner and signer of the user account
    pub lending_market: Pubkey,           // PDA of the user's associated lending market
    pub deposited_collateral_amount: u64, // Amount of collateral tokens deposited by the user
    pub borrowed_amount: u64,             // Amount of borrowed or loaned tokens by the user
    pub bump: u8,                         // PDA bump seed for the user account
}

impl UserAccount {
    pub const LEN: usize = 8 // Anchor discriminator
        + 32 // user
        + 32 // lending_market
        + 8 // deposited_collateral_amount
        + 8 // borrowed_amount
        + 1; // bump
}
