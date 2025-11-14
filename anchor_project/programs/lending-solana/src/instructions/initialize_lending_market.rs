use anchor_lang::prelude::*;
use anchor_spl::token::{Token, Mint, TokenAccount};

use crate::states::*;

pub fn initialize_lending_market(ctx: Context<InitializeLendingMarket>) -> Result<()> {
    let lending_market = &mut ctx.accounts.lending_market;

    lending_market.collateral_mint = ctx.accounts.collateral_mint.key();
    lending_market.loan_mint = ctx.accounts.loan_mint.key();
    lending_market.collateral_vault = ctx.accounts.collateral_vault.key();
    lending_market.loan_vault = ctx.accounts.loan_vault.key();
    lending_market.interest_rate_bps = INTEREST_RATE_BPS;
    lending_market.collateral_ratio_bps = COLLATERAL_RATIO_BPS;
    lending_market.collateral_amount = 0;
    lending_market.borrowed_amount = 0;
    lending_market.bump = ctx.bumps.lending_market;

    Ok(())
}

#[derive(Accounts)]
pub struct InitializeLendingMarket<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(
        init, 
        payer = user, 
        space = 8 + LendingMarket::INIT_SPACE,
        seeds = [b"lending-market"],
        bump
    )]
    pub lending_market: Account<'info, LendingMarket>,
    pub system_program: Program<'info, System>,
    #[account(
        init,
        payer = user,
        seeds = [b"collateral-vault", lending_market.key().as_ref()],
        bump,
        token::mint = collateral_mint,
        token::authority = lending_market,
    )]
    pub collateral_vault: Account<'info, TokenAccount>,
    pub collateral_mint: Account<'info, Mint>,
    #[account(
        init,
        payer = user,
        seeds = [b"loan-vault", lending_market.key().as_ref()],
        bump,
        token::mint = loan_mint,
        token::authority = lending_market,
    )]
    pub loan_vault: Account<'info, TokenAccount>,
    pub loan_mint: Account<'info, Mint>,
    pub token_program: Program<'info, Token>,
}