use anchor_lang::prelude::*;

use crate::states::*;

pub fn create_user_account(ctx: Context<CreateUserAccount>) -> Result<()> {
    let user_account = &mut ctx.accounts.user_account;

    user_account.user = ctx.accounts.user.key();
    user_account.lending_market = ctx.accounts.lending_market.key();
    user_account.deposited_collateral_amount = 0;
    user_account.borrowed_amount = 0;
    user_account.bump = ctx.bumps.user_account;

    Ok(())
}

#[derive(Accounts)]
pub struct CreateUserAccount<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    pub lending_market: Account<'info, LendingMarket>,
    #[account(
        init,
        payer = user,
        space = 8 + UserAccount::INIT_SPACE,
        seeds = [b"user-account", user.key().as_ref()],
        bump
    )]
    pub user_account: Account<'info, UserAccount>,
    pub system_program: Program<'info, System>,
}