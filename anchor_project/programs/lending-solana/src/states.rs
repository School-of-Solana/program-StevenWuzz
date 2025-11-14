use anchor_lang::prelude::*;

pub const INTEREST_RATE_BPS: u16 = 500;
pub const COLLATERAL_RATIO_BPS: u16 = 12000;

#[account]
#[derive(InitSpace)]
pub struct LendingMarket {
    pub collateral_mint: Pubkey, // Token mint accepted as collateral
    pub loan_mint: Pubkey, // Token mint used for loans
    pub collateral_vault: Pubkey, // PDA token account holding the deposited collateral
    pub loan_vault: Pubkey, // PDA token account holding the available loan liquidity
    pub interest_rate_bps: u16, // Fixed annual interest rate in basis points (e.g., 500 = 5%)
    pub collateral_ratio_bps: u16, // Required collateralization ratio in basis points (e.g., 12000 = 120%)
    pub collateral_amount: u64, // Total collateral deposited into the market
    pub borrowed_amount: u64, // Total amount borrowed from the market
    pub bump: u8, // PDA bump seed for the lending market account
}

#[account]
#[derive(InitSpace)]
pub struct UserAccount {
    pub user: Pubkey, // Owner and signer of the user account
    pub lending_market: Pubkey, // PDA of the user's associated lending market
    pub deposited_collateral_amount: u64, // Amount of collateral tokens deposited by the user
    pub borrowed_amount: u64, // Amount of borrowed or loaned tokens by the user
    pub bump: u8, // PDA bump seed for the user account
}