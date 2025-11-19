use crate::instructions::*;
use anchor_lang::prelude::*;

pub mod errors;
pub mod instructions;
pub mod states;

declare_id!("8L5TT5QKsktaowcfstwz2h6aNg5Q9izfuLLq76wyJqZ");

#[program]
pub mod lending_solana {
    use super::*;

    pub fn initialize_lending_market(ctx: Context<InitializeLendingMarket>) -> Result<()> {
        instructions::initialize_lending_market(ctx)
    }

    pub fn create_user_account(ctx: Context<CreateUserAccount>) -> Result<()> {
        instructions::create_user_account(ctx)
    }

    pub fn deposit_collateral(
        ctx: Context<DepositCollateral>,
        collateral_amount: u64,
    ) -> Result<()> {
        instructions::deposit_collateral(ctx, collateral_amount)
    }

    pub fn borrow_token(ctx: Context<BorrowToken>, borrow_amount: u64) -> Result<()> {
        instructions::borrow_token(ctx, borrow_amount)
    }

    pub fn fund_loan_vault(ctx: Context<FundLoanVault>, amount: u64) -> Result<()> {
        instructions::fund_loan_vault(ctx, amount)
    }
}
