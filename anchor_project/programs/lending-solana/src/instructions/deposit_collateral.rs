use anchor_lang::prelude::*;
use anchor_spl::token::{TokenAccount, Token, Transfer, transfer};

use crate::{errors::LendingError, states::*};

pub fn deposit_collateral(ctx: Context<DepositCollateral>, collateral_amount: u64) -> Result<()> {
    // Ensure that user's and lending market's collateral amounts will not overflow after this deposit
    let user_total_collateral = ctx.accounts.user_account.deposited_collateral_amount
        .checked_add(collateral_amount)
        .ok_or(LendingError::UserCollateralOverflow)?;
    let lending_market_total_collateral = ctx.accounts.lending_market.collateral_amount
        .checked_add(collateral_amount)
        .ok_or(LendingError::MarketCollateralOverflow)?;

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

    // Update the collateral amount in the user account and lending market after the transfer is successful
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
    pub lending_market: Account<'info, LendingMarket>,
    #[account(mut)]
    pub user_collateral_token_account: Account<'info, TokenAccount>,
    #[account(
        mut,
        constraint = collateral_vault.key() == lending_market.collateral_vault @ LendingError::MismatchedCollateralVault,
        constraint = collateral_vault.mint == lending_market.collateral_mint @ LendingError::MistmatchedCollateralMint,
    )]
    pub collateral_vault: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}
