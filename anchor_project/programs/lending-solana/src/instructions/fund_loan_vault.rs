use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, MintTo, Token, TokenAccount};

use crate::{
    errors::LendingError,
    states::{LendingMarket, LENDING_MARKET_SEED},
};

pub fn fund_loan_vault(ctx: Context<FundLoanVault>, amount: u64) -> Result<()> {
    token::mint_to(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            MintTo {
                mint: ctx.accounts.loan_mint.to_account_info(),
                to: ctx.accounts.loan_vault.to_account_info(),
                authority: ctx.accounts.lending_market.to_account_info(),
            },
            &[&[LENDING_MARKET_SEED, &[ctx.accounts.lending_market.bump]]],
        ),
        amount,
    )?;

    Ok(())
}

#[derive(Accounts)]
pub struct FundLoanVault<'info> {
    pub authority: Signer<'info>,
    #[account(
        mut,
        constraint = lending_market.authority == authority.key()
    )]
    pub lending_market: Account<'info, LendingMarket>,
    #[account(
        mut,
        constraint = loan_mint.key() == lending_market.loan_mint
    )]
    pub loan_mint: Account<'info, Mint>,
    #[account(
        mut,
        constraint = loan_vault.owner == lending_market.key() @ LendingError::MismatchedLoanVaultOwner,
        constraint = loan_vault.mint == lending_market.loan_mint @ LendingError::MistmatchedCollateralMint,
    )]
    pub loan_vault: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}
