use anchor_lang::prelude::*;
use anchor_spl::token::{TokenAccount, Token, Transfer, transfer};

use crate::{errors::LendingError, states::*};

pub fn borrow_token(ctx: Context<BorrowToken>, borrow_amount: u64) -> Result<()> {
    // Max allowable borrow = (deposited collateral * 10000) / collateral ratio (in bps)
    let max_allowable_borrow = ctx.accounts.user_account.deposited_collateral_amount
        .checked_mul(10000)
        .ok_or(LendingError::UserBorrowOverflow)?
        .checked_div(ctx.accounts.lending_market.collateral_ratio_bps as u64)
        .ok_or(LendingError::UserBorrowOverflow)?;

    // User's total borrowed amount after this new borrow
    let user_total_borrowed = ctx.accounts.user_account.borrowed_amount
        .checked_add(borrow_amount)
        .ok_or(LendingError::UserBorrowOverflow)?;
    // Lending market's total borrowed amount after this new borrow
    let lending_market_total_borrowed = ctx.accounts.lending_market.borrowed_amount.checked_add(borrow_amount).ok_or(LendingError::MarketBorrowOverflow)?;

    // Ensure that lending market has enough tokens in the loan vault to lend out
    require!(lending_market_total_borrowed <= ctx.accounts.loan_vault.amount, LendingError::InsufficientLoanVaultLiquidity);
    // Ensure that if user borrow this amount, he or she does not exceed the maximum allowable borrow
    require!(user_total_borrowed <= max_allowable_borrow, LendingError::UserMaxBorrowExceeded);

    // Transfer the total borrowed amount from the loan vault to the user's loan token account
    transfer(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.loan_vault.to_account_info(),
                to: ctx.accounts.user_loan_token_account.to_account_info(),
                authority: ctx.accounts.lending_market.to_account_info(),
            },
            &[&[
                b"lending-market",
                &[ctx.accounts.lending_market.bump],
            ]],
        ),
        borrow_amount,
    )?;

    // Update the borrowed amount in the user account and lending market after the transfer is successful
    ctx.accounts.user_account.borrowed_amount = user_total_borrowed;
    ctx.accounts.lending_market.borrowed_amount = lending_market_total_borrowed;

    Ok(())
}

#[derive(Accounts)]
pub struct BorrowToken<'info> {
    pub user: Signer<'info>,
    #[account(
        mut,
        has_one = user,
        has_one = lending_market,
    )]
    pub user_account: Account<'info, UserAccount>,
    #[account(mut)]
    pub lending_market: Account<'info, LendingMarket>,
    #[account(mut)]
    pub user_loan_token_account: Account<'info, TokenAccount>,
    #[account(
        mut,
        constraint = loan_vault.owner == lending_market.key() @ LendingError::MismatchedLoanVaultOwner,
        constraint = loan_vault.mint == lending_market.loan_mint @ LendingError::MistmatchedCollateralMint,
    )]
    pub loan_vault: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}