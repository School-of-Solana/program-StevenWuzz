import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { LendingSolana } from "../target/types/lending_solana";
import { TOKEN_PROGRAM_ID, getAccount, createAssociatedTokenAccount } from "@solana/spl-token";
import { assert } from "chai";

describe("lending-solana", () => {
  const program = anchor.workspace.lendingSolana as Program<LendingSolana>;
  const provider = anchor.AnchorProvider.local();
  anchor.setProvider(provider);
  const payer = provider.wallet.payer;
  const LENDING_MARKET_SEED = "lending-market-v2";
  const COLLATERAL_MINT_SEED = "collateral-mint-v2";
  const COLLATERAL_VAULT_SEED = "collateral-vault-v2";
  const LOAN_MINT_SEED = "loan-mint-v2";
  const LOAN_VAULT_SEED = "loan-vault-v2";
  const USER_ACCOUNT_SEED = "user-account-v2";

  const airdrop = async (connection: any, address: any, amount = 1000000000) => {
    await connection.confirmTransaction(await connection.requestAirdrop(address, amount), "confirmed");
  }
  
  const getPda = (seed: string, authority?: anchor.web3.PublicKey) => {
    return anchor.web3.PublicKey.findProgramAddressSync(
      authority? [Buffer.from(seed), authority.toBuffer()] : [Buffer.from(seed)],
      program.programId
    );
  }
  const [lendingMarketPda] = getPda(LENDING_MARKET_SEED);
  const [collateralMintPda] = getPda(COLLATERAL_MINT_SEED, lendingMarketPda);
  const [collateralVaultPda] = getPda(COLLATERAL_VAULT_SEED, lendingMarketPda);
  const [loanMintPda] = getPda(LOAN_MINT_SEED, lendingMarketPda);
  const [loanVaultPda] = getPda(LOAN_VAULT_SEED, lendingMarketPda);

  const initializeLendingMarket = async () => {
    await program.methods.initializeLendingMarket().accounts({
      lendingMarket: lendingMarketPda,
      collateralMint: collateralMintPda,
      loanMint: loanMintPda,
      collateralVault: collateralVaultPda,
      loanVault: loanVaultPda,
      systemProgram: anchor.web3.SystemProgram.programId,
      tokenProgram: TOKEN_PROGRAM_ID,
    }).signers([payer]).rpc();
  }
  
  const fundLoanVault = async (amount: number | anchor.BN) => {
    await program.methods.fundLoanVault(new anchor.BN(amount)).accounts({
      authority: payer.publicKey,
      lendingMarket: lendingMarketPda,
      loanMint: loanMintPda,
      loanVault: loanVaultPda,
      tokenProgram: TOKEN_PROGRAM_ID,
    }).signers([payer]).rpc();
  }
  const closeLendingMarket = async () => {
    await program.methods.closeLendingMarket().accounts({
      authority: payer.publicKey,
      lendingMarket: lendingMarketPda,
      collateralMint: collateralMintPda,
      loanMint: loanMintPda,
      collateralVault: collateralVaultPda,
      loanVault: loanVaultPda,
      tokenProgram: TOKEN_PROGRAM_ID,
    }).signers([payer]).rpc();
  }
  
  describe("Initialize Lending Market", () => {
    it("Initializes the lending market", async () => {
      await initializeLendingMarket();

      // Verify the properties of an initial lending market account
      const lendingMarket = await program.account.lendingMarket.fetch(lendingMarketPda);
      assert.ok(lendingMarket.authority.equals(payer.publicKey), "Authority mismatch");
      assert.ok(lendingMarket.collateralRatioBps === 12000, "Collateral ratio mismatch");
      assert.ok(lendingMarket.interestRateBps === 500, "Interest rate mismatch");
      assert.ok(lendingMarket.collateralMint.equals(collateralMintPda), "Collateral mint mismatch");
      assert.ok(lendingMarket.loanMint.equals(loanMintPda), "Loan mint mismatch");
      assert.ok(lendingMarket.collateralVault.equals(collateralVaultPda), "Collteral vault mismatch");
      assert.ok(lendingMarket.loanVault.equals(loanVaultPda), "Loan vault mismatch");

      // Verify the properties of the collateral vault token account
      const collateralVault = await getAccount(provider.connection, collateralVaultPda);
      assert.ok(collateralVault.mint.equals(collateralMintPda), "Collateral vault's mint ownership mismatch");
      assert.ok(collateralVault.owner.equals(lendingMarketPda), "Collateral vault's owner mismatch");
      assert.equal(collateralVault.amount, BigInt(0), "Initial amount in the collateral vault should be zero");

      // Verify the properties of the loan vault token account
      const loanVault = await getAccount(provider.connection, loanVaultPda);
      assert.ok(loanVault.mint.equals(loanMintPda));
      assert.ok(loanVault.owner.equals(lendingMarketPda));
      assert.equal(loanVault.amount, BigInt(0), "Initial amount in the loan vault should be zero");
    });

    it("Cannot initialize the lending market twice", async () => {
      let flag = "This should fail";

      try {
        await initializeLendingMarket(); // Attempt to re-initialize the lending market
        assert.fail("Should have thrown an error due to re-initialization");
      }
      catch (err) {
        flag = "Failed";
        assert.isTrue(err.toString().includes("already in use"));
      }
      
      assert.strictEqual(flag, "Failed", "Initializing lending market twice should have failed");
    });
  });

  describe("Create User Account", () => {
    it("Should fail when a malicious user tries to create a user account for another user", async () => {
      const maliciousUser = anchor.web3.Keypair.generate();
      const victimUser = anchor.web3.Keypair.generate();
      const [victimUserAccountPda] = getPda(USER_ACCOUNT_SEED, victimUser.publicKey);

      let flag = "This should fail";

      try {
        await program.methods.createUserAccount().accounts({
          user: maliciousUser.publicKey,
          userAccount: victimUserAccountPda,
          lendingMarket: lendingMarketPda,
          systemProgram: anchor.web3.SystemProgram.programId,
        }).signers([maliciousUser]).rpc();

        assert.fail("Should have thrown an error due to an unauthorized creation of a user account");
      }
      catch (err) {
        flag = "Failed";
        assert.isTrue(err.message.includes("constraint") || err.message.includes("seeds"), "Expected constraint or seeds error when trying to initialize an account for another user");
      }
      
      assert.strictEqual(flag, "Failed", "A malicious user should not be able to create a user account for another user");
    });

    it("Should succeed when a user creates his or her own user account", async () => {
      const user = anchor.web3.Keypair.generate();
      await airdrop(provider.connection, user.publicKey);
      const [userAccountPda] = getPda(USER_ACCOUNT_SEED, user.publicKey);

      await program.methods.createUserAccount().accounts({
        user: user.publicKey,
        userAccount: userAccountPda,
        lendingMarket: lendingMarketPda,
        systemProgram: anchor.web3.SystemProgram.programId,
      }).signers([user]).rpc();

      // Verify the properties of the newly created user account
      const userAccount = await program.account.userAccount.fetch(userAccountPda);
      assert.ok(userAccount.user.equals(user.publicKey), "User account's owner mismatch");
      assert.ok(userAccount.lendingMarket.equals(lendingMarketPda), "User account's lending market mismatch");
      assert.ok(userAccount.depositedCollateralAmount.eq(new anchor.BN(0)), "Initial deposited collateral should be zero");
      assert.ok(userAccount.borrowedAmount.eq(new anchor.BN(0)), "Initial borrowed amount should be zero");
    });
  });

  describe("Deposit Collateral", () => {
    it("Should fail when a user tries to transfer some collateral from another user's token account", async () => {
      const victimUser = anchor.web3.Keypair.generate();
      const maliciousUser = anchor.web3.Keypair.generate();
      await airdrop(provider.connection, victimUser.publicKey);
      await airdrop(provider.connection, maliciousUser.publicKey);

      const victimUserAssociatedTokenAccount = await createAssociatedTokenAccount(
        provider.connection,
        victimUser,
        collateralMintPda,
        victimUser.publicKey
      );

      const [maliciousUserAccountPda] = getPda(USER_ACCOUNT_SEED, maliciousUser.publicKey);
      await program.methods.createUserAccount().accounts({
        user: maliciousUser.publicKey,
        userAccount: maliciousUserAccountPda,
        lendingMarket: lendingMarketPda,
        systemProgram: anchor.web3.SystemProgram.programId,
      }).signers([maliciousUser]).rpc();

      let flag = "This should fail";
      try { 
        await program.methods.depositCollateral(new anchor.BN(1000000)).accounts({
          user: maliciousUser.publicKey,
          userAccount: maliciousUserAccountPda,
          lendingMarket: lendingMarketPda,
          collateralMint: collateralMintPda,
          userCollateralTokenAccount: victimUserAssociatedTokenAccount, // Maliciously using victim's token account
          collateralVault: collateralVaultPda,
          tokenProgram: TOKEN_PROGRAM_ID,
        }).signers([maliciousUser]).rpc();

        assert.fail("Should have thrown an error due to an unauthorized collateral deposit");
      } catch (err) {
        flag = "Failed";
        assert.isTrue(
          err.message.includes("does not own the provided collateral token"),
          "Expected ownership error when trying to deposit using another user's token account"
        );
      }

      assert.strictEqual(flag, "Failed", "A malicious user should not be able to deposit collateral from another user's account");
    });

    it("Should succeed when a user deposits collateral from his or her own token account", async () => {
      const user = anchor.web3.Keypair.generate();
      await airdrop(provider.connection, user.publicKey);

      const userAssociatedTokenAccount = await createAssociatedTokenAccount(
        provider.connection,
        user,
        collateralMintPda,
        user.publicKey
      );

      const [userAccountPda] = getPda(USER_ACCOUNT_SEED, user.publicKey);
      await program.methods.createUserAccount().accounts({
        user: user.publicKey,
        userAccount: userAccountPda,
        lendingMarket: lendingMarketPda,
        systemProgram: anchor.web3.SystemProgram.programId,
      }).signers([user]).rpc();

      await program.methods.depositCollateral(new anchor.BN(1000000)).accounts({
        user: user.publicKey,
        userAccount: userAccountPda,
        lendingMarket: lendingMarketPda,
        collateralMint: collateralMintPda,
        userCollateralTokenAccount: userAssociatedTokenAccount,
        collateralVault: collateralVaultPda,
        tokenProgram: TOKEN_PROGRAM_ID,
      }).signers([user]).rpc();

      // Verify the deposited collateral amount in the user account and the lending market after the transfer is successful
      const userAccount = await program.account.userAccount.fetch(userAccountPda);
      const lendingMarket = await program.account.lendingMarket.fetch(lendingMarketPda);
      assert.ok(userAccount.depositedCollateralAmount.eq(new anchor.BN(1000000)), "Deposited collateral amount mismatch");
      assert.ok(lendingMarket.collateralAmount.eq(new anchor.BN(1000000)), "Lending market collateral amount mismatch");
    });
  });

  describe("Borrow Token", () => {
    it("Should fail when the loan vault does not have enough liquidity to lend out tokens", async () => {
      const user = anchor.web3.Keypair.generate();
      await airdrop(provider.connection, user.publicKey);

      const userAssociatedCollateralTokenAccount = await createAssociatedTokenAccount(
        provider.connection,
        user,
        collateralMintPda,
        user.publicKey
      );
      const userAssociatedLoanTokenAccount = await createAssociatedTokenAccount(
        provider.connection,
        user,
        loanMintPda,
        user.publicKey
      );

      const [userAccountPda] = getPda(USER_ACCOUNT_SEED, user.publicKey);
      await program.methods
        .createUserAccount()
        .accounts({
          user: user.publicKey,
          userAccount: userAccountPda,
          lendingMarket: lendingMarketPda,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([user])
        .rpc();

      await program.methods
        .depositCollateral(new anchor.BN(1000))
        .accounts({
          user: user.publicKey,
          userAccount: userAccountPda,
          lendingMarket: lendingMarketPda,
          collateralMint: collateralMintPda,
          userCollateralTokenAccount: userAssociatedCollateralTokenAccount,
          collateralVault: collateralVaultPda,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([user])
        .rpc();

      let flag = "This should fail";
      try {
        await program.methods
          .borrowToken(new anchor.BN(10))
          .accounts({
            user: user.publicKey,
            userAccount: userAccountPda,
            lendingMarket: lendingMarketPda,
            userLoanTokenAccount: userAssociatedLoanTokenAccount,
            loanVault: loanVaultPda,
            tokenProgram: TOKEN_PROGRAM_ID,
          })
          .signers([user])
          .rpc();

        assert.fail("Should have thrown an error due to insufficient loan vault liquidity");
      } catch (err) {
        flag = "Failed";
        assert.isTrue(
          err.toString().includes("Lending market does not have enough tokens in the loan vault"),
          "Expected insufficient liquidity error"
        );
      }

      assert.strictEqual(
        flag,
        "Failed",
        "Borrowing should fail when the loan vault lacks liquidity"
      );
    });

    it("Should fail when a user tries to borrow more than maximum allowable amount based on collateral", async () => {
      const user = anchor.web3.Keypair.generate();
      await airdrop(provider.connection, user.publicKey);

      const userAssociatedTokenAccount = await createAssociatedTokenAccount(
        provider.connection,
        user,
        collateralMintPda,
        user.publicKey
      );

      await fundLoanVault(100000000);

      const [userAccountPda] = getPda(USER_ACCOUNT_SEED, user.publicKey);
      await program.methods.createUserAccount().accounts({
        user: user.publicKey,
        userAccount: userAccountPda,
        lendingMarket: lendingMarketPda,
        systemProgram: anchor.web3.SystemProgram.programId,
      }).signers([user]).rpc();

      await program.methods.depositCollateral(new anchor.BN(100)).accounts({
        user: user.publicKey,
        userAccount: userAccountPda,
        lendingMarket: lendingMarketPda,
        collateralMint: collateralMintPda,
        userCollateralTokenAccount: userAssociatedTokenAccount,
        collateralVault: collateralVaultPda,
        tokenProgram: TOKEN_PROGRAM_ID,
      }).signers([user]).rpc();

      let flag = "This should fail";
      try {
        // Attempt to borrow more than the maximum allowable amount based on the user's deposited collateral
        await program.methods.borrowToken(new anchor.BN(500000)).accounts({
          user: user.publicKey,
          userAccount: userAccountPda,
          lendingMarket: lendingMarketPda,
          userLoanTokenAccount: userAssociatedTokenAccount, // Using the same token account for simplicity
          loanVault: loanVaultPda,
          tokenProgram: TOKEN_PROGRAM_ID,
        }).signers([user]).rpc();

        assert.fail("Should have thrown an error due to exceeding the maximum allowable borrow amount");
      } catch (err) {
        flag = "Failed";
        assert.isTrue(err.toString().includes("User's total borrow amount will exceed the maximum allowable borrow"), "Expected error for exceeding borrow limit based on collateral");
      }
      
      assert.strictEqual(flag, "Failed", "A user should not be able to borrow more than the maximum allowable amount based on collateral");
    });

    it("Should fail when a user tries to borrow using another user's loan token account", async () => {
      const victimUser = anchor.web3.Keypair.generate();
      const maliciousUser = anchor.web3.Keypair.generate();
      await airdrop(provider.connection, victimUser.publicKey);
      await airdrop(provider.connection, maliciousUser.publicKey);

      const victimUserAssociatedTokenAccount = await createAssociatedTokenAccount(
        provider.connection,
        victimUser,
        collateralMintPda,
        victimUser.publicKey
      );
      await fundLoanVault(1000000000);

      const [victimUserAccountPda] = getPda(USER_ACCOUNT_SEED, victimUser.publicKey);
      await program.methods.createUserAccount().accounts({
        user: victimUser.publicKey,
        userAccount: victimUserAccountPda,
        lendingMarket: lendingMarketPda,
        systemProgram: anchor.web3.SystemProgram.programId,
      }).signers([victimUser]).rpc();
      await program.methods.depositCollateral(new anchor.BN(1000000)).accounts({
        user: victimUser.publicKey,
        userAccount: victimUserAccountPda,
        lendingMarket: lendingMarketPda,
        collateralMint: collateralMintPda,
        userCollateralTokenAccount: victimUserAssociatedTokenAccount,
        collateralVault: collateralVaultPda,
        tokenProgram: TOKEN_PROGRAM_ID,
      }).signers([victimUser]).rpc();

      let firstTryFlag = "This should fail";
      let secondTryFlag = "This should fail too";
      const maliciousUserAssociatedLoanTokenAccount = await createAssociatedTokenAccount(
        provider.connection,
        maliciousUser,
        loanMintPda,
        maliciousUser.publicKey
      );
      try {
        await program.methods.borrowToken(new anchor.BN(10)).accounts({
          user: maliciousUser.publicKey,
          userAccount: victimUserAccountPda,
          lendingMarket: lendingMarketPda,
          userLoanTokenAccount: maliciousUserAssociatedLoanTokenAccount,
          loanVault: loanVaultPda,
          tokenProgram: TOKEN_PROGRAM_ID,
        }).signers([maliciousUser]).rpc();
      } catch (err) {
        firstTryFlag = "Failed";
        assert.isTrue(err.message.includes("A has one constraint was violated"), "Expected constraint error when trying to borrow tokens from another user's account");
      }
      try {
        await program.methods.borrowToken(new anchor.BN(10)).accounts({
          user: victimUser.publicKey,
          userAccount: victimUserAccountPda,
          lendingMarket: lendingMarketPda,
          userLoanTokenAccount: maliciousUserAssociatedLoanTokenAccount,
          loanVault: loanVaultPda,
          tokenProgram: TOKEN_PROGRAM_ID,
        }).signers([maliciousUser]).rpc();
      } catch (err) {
        secondTryFlag = "Failed";
        assert.isTrue(err.message.includes("unknown signer"), "Expected constraint error when trying to borrow tokens from another user's account");
      }
    
      assert.strictEqual(firstTryFlag, "Failed", "A user should not be able to borrow using another user's token account");
      assert.strictEqual(secondTryFlag, "Failed", "A user should not be able to borrow using another user's token account");
    });

    it("Should succeed when a user tries to borrow from his or her own account within the maximum allowable borrow amount", async () => {
      const user = anchor.web3.Keypair.generate();
      await airdrop(provider.connection, user.publicKey);

      const userAssociatedCollateralTokenAccount = await createAssociatedTokenAccount(
        provider.connection,
        user,
        collateralMintPda,
        user.publicKey
      );
      const userAssociatedLoanTokenAccount = await createAssociatedTokenAccount(
        provider.connection,
        user,
        loanMintPda,
        user.publicKey
      );

      await fundLoanVault(1000000000);

      const [userAccountPda] = getPda(USER_ACCOUNT_SEED, user.publicKey);
      await program.methods.createUserAccount().accounts({
        user: user.publicKey,
        userAccount: userAccountPda,
        lendingMarket: lendingMarketPda,
        systemProgram: anchor.web3.SystemProgram.programId,
      }).signers([user]).rpc();

      await program.methods.depositCollateral(new anchor.BN(1200000)).accounts({
        user: user.publicKey,
        userAccount: userAccountPda,
        lendingMarket: lendingMarketPda,
        collateralMint: collateralMintPda,
        userCollateralTokenAccount: userAssociatedCollateralTokenAccount,
        collateralVault: collateralVaultPda,
        tokenProgram: TOKEN_PROGRAM_ID,
      }).signers([user]).rpc();

      const loanVaultBeforeBorrow = await getAccount(provider.connection, loanVaultPda);
      const borrowAmount = new anchor.BN(1000000); // Within the 120% collateral ratio
      await program.methods.borrowToken(borrowAmount).accounts({
        user: user.publicKey,
        userAccount: userAccountPda,
        lendingMarket: lendingMarketPda,
        userLoanTokenAccount: userAssociatedLoanTokenAccount,
        loanVault: loanVaultPda,
        tokenProgram: TOKEN_PROGRAM_ID,
      }).signers([user]).rpc();

      const userAccount = await program.account.userAccount.fetch(userAccountPda);
      const lendingMarket = await program.account.lendingMarket.fetch(lendingMarketPda);
      const userLoanAccount = await getAccount(provider.connection, userAssociatedLoanTokenAccount);

      assert.ok(userAccount.borrowedAmount.eq(borrowAmount), "User borrowed amount mismatch");
      assert.ok(lendingMarket.borrowedAmount.eq(borrowAmount), "Lending market borrowed amount mismatch");
      assert.equal(userLoanAccount.amount, BigInt(borrowAmount.toNumber()), "Borrowed tokens were not received");

      const loanVaultAfterBorrow = await getAccount(provider.connection, loanVaultPda);
      assert.equal(
        loanVaultAfterBorrow.amount, loanVaultBeforeBorrow.amount - BigInt(borrowAmount.toNumber()),
        "Loan vault amount mismatch after borrow"
      );
    });
  });

  describe("Fund Loan Vault", () => {
    it("Should succeed when called by the right market authority", async () => {
      const initialVault = await getAccount(provider.connection, loanVaultPda);
      const amount = new anchor.BN(5000);
      await program.methods.fundLoanVault(amount).accounts({
        authority: payer.publicKey,
        lendingMarket: lendingMarketPda,
        loanMint: loanMintPda,
        loanVault: loanVaultPda,
        tokenProgram: TOKEN_PROGRAM_ID,
      }).signers([payer]).rpc();

      const updatedVault = await getAccount(provider.connection, loanVaultPda);
      assert.equal(
        updatedVault.amount,
        initialVault.amount + BigInt(amount.toNumber()),
        "Loan vault should increase by funded amount"
      );
    });

    it("Should fail when a non-authority tries to fund the vault", async () => {
      const stranger = anchor.web3.Keypair.generate();
      await airdrop(provider.connection, stranger.publicKey);

      let flag = "This should fail";
      try {
        await program.methods.fundLoanVault(new anchor.BN(100)).accounts({
          authority: stranger.publicKey,
          lendingMarket: lendingMarketPda,
          loanMint: loanMintPda,
          loanVault: loanVaultPda,
          tokenProgram: TOKEN_PROGRAM_ID,
        }).signers([stranger]).rpc();

        assert.fail("Should have thrown an error due to an unauthorized attempt to fund the loan vault");
      } catch (err) {
        flag = "Failed";
        assert.isTrue(
          err.toString().includes("authority") || err.toString().includes("constraint"),
          "Expected authority constraint error"
        );
      }

      assert.strictEqual(flag, "Failed", "Non-authority funding should fail");
    });
  });

});
