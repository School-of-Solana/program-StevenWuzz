use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};

use crate::states::*;

pub fn initialize_lending_market(ctx: Context<InitializeLendingMarket>) -> Result<()> {
    let lending_market = &mut ctx.accounts.lending_market;

    lending_market.authority = ctx.accounts.payer.key();
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
    pub payer: Signer<'info>,
    #[account(
        init,
        payer = payer,
        space = LendingMarket::LEN,
        seeds = [LENDING_MARKET_SEED],
        bump
    )]
    pub lending_market: Account<'info, LendingMarket>,
    pub system_program: Program<'info, System>,
    #[account(
        init,
        payer = payer,
        seeds = [COLLATERAL_MINT_SEED, lending_market.key().as_ref()],
        bump,
        mint::decimals = 6,
        mint::authority = lending_market,
        mint::freeze_authority = lending_market,
    )]
    pub collateral_mint: Account<'info, Mint>,
    #[account(
        init,
        payer = payer,
        seeds = [COLLATERAL_VAULT_SEED, lending_market.key().as_ref()],
        bump,
        token::mint = collateral_mint,
        token::authority = lending_market,
    )]
    pub collateral_vault: Account<'info, TokenAccount>,
    #[account(
        init,
        payer = payer,
        seeds = [LOAN_MINT_SEED, lending_market.key().as_ref()],
        bump,
        mint::decimals = 6,
        mint::authority = lending_market,
        mint::freeze_authority = lending_market,
    )]
    pub loan_mint: Account<'info, Mint>,
    #[account(
        init,
        payer = payer,
        seeds = [LOAN_VAULT_SEED, lending_market.key().as_ref()],
        bump,
        token::mint = loan_mint,
        token::authority = lending_market,
    )]
    pub loan_vault: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}
