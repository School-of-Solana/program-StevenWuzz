use anchor_lang::prelude::*;
use anchor_spl::token::{self, transfer, Mint, MintTo, Token, TokenAccount, Transfer};

use crate::{errors::LendingError, states::*};

pub fn deposit_collateral(ctx: Context<DepositCollateral>, collateral_amount: u64) -> Result<()> {
    // Ensure that user's and lending market's collateral amounts will not overflow after this deposit
    let user_total_collateral = ctx
        .accounts
        .user_account
        .deposited_collateral_amount
        .checked_add(collateral_amount)
        .ok_or(LendingError::UserCollateralOverflow)?;
    let lending_market_total_collateral = ctx
        .accounts
        .lending_market
        .collateral_amount
        .checked_add(collateral_amount)
        .ok_or(LendingError::MarketCollateralOverflow)?;

    // Mint the requested collateral amount to the user's token account using the lending market PDA
    token::mint_to(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            MintTo {
                mint: ctx.accounts.collateral_mint.to_account_info(),
                to: ctx.accounts.user_collateral_token_account.to_account_info(),
                authority: ctx.accounts.lending_market.to_account_info(),
            },
            &[&[LENDING_MARKET_SEED, &[ctx.accounts.lending_market.bump]]],
        ),
        collateral_amount,
    )?;

    // Transfer the specified amount of collateral from the user's collateral token account to the collateral vault
    transfer(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.user_collateral_token_account.to_account_info(),
                to: ctx.accounts.collateral_vault.to_account_info(),
                authority: ctx.accounts.user.to_account_info(),
            },
        ),
        collateral_amount,
    )?;

    // Update the deposited collateral amount in the user account and lending market after the transfer is successful
    ctx.accounts.user_account.deposited_collateral_amount = user_total_collateral;
    ctx.accounts.lending_market.collateral_amount = lending_market_total_collateral;

    Ok(())
}

#[derive(Accounts)]
pub struct DepositCollateral<'info> {
    pub user: Signer<'info>,
    #[account(
        mut,
        has_one = user,
        has_one = lending_market,
    )]
    pub user_account: Account<'info, UserAccount>,
    #[account(mut)]
    pub lending_market: Account<'info, LendingMarket>,
    #[account(
        mut,
        constraint = collateral_mint.key() == lending_market.collateral_mint
    )]
    pub collateral_mint: Account<'info, Mint>,
    #[account(
        mut,
        constraint = user_collateral_token_account.owner == user.key() @ LendingError::MismatchedCollateralTokenAccountOwner,
        constraint = user_collateral_token_account.mint == lending_market.collateral_mint @ LendingError::MistmatchedCollateralMint,
    )]
    pub user_collateral_token_account: Account<'info, TokenAccount>,
    #[account(
        mut,
        constraint = collateral_vault.owner == lending_market.key() @ LendingError::MismatchedCollateralTokenAccountOwner,
        constraint = collateral_vault.mint == lending_market.collateral_mint @ LendingError::MistmatchedCollateralMint,
    )]
    pub collateral_vault: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}
