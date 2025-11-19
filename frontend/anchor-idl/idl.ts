/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/lending_solana.json`.
 */
export type LendingSolana = {
  "address": "8L5TT5QKsktaowcfstwz2h6aNg5Q9izfuLLq76wyJqZ",
  "metadata": {
    "name": "lendingSolana",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "borrowToken",
      "discriminator": [
        80,
        33,
        22,
        50,
        103,
        128,
        181,
        231
      ],
      "accounts": [
        {
          "name": "user",
          "signer": true,
          "relations": [
            "userAccount"
          ]
        },
        {
          "name": "userAccount",
          "writable": true
        },
        {
          "name": "lendingMarket",
          "writable": true,
          "relations": [
            "userAccount"
          ]
        },
        {
          "name": "userLoanTokenAccount",
          "writable": true
        },
        {
          "name": "loanVault",
          "writable": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": [
        {
          "name": "borrowAmount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "createUserAccount",
      "discriminator": [
        146,
        68,
        100,
        69,
        63,
        46,
        182,
        199
      ],
      "accounts": [
        {
          "name": "user",
          "writable": true,
          "signer": true
        },
        {
          "name": "lendingMarket"
        },
        {
          "name": "userAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  117,
                  115,
                  101,
                  114,
                  45,
                  97,
                  99,
                  99,
                  111,
                  117,
                  110,
                  116,
                  45,
                  118,
                  50
                ]
              },
              {
                "kind": "account",
                "path": "user"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "depositCollateral",
      "discriminator": [
        156,
        131,
        142,
        116,
        146,
        247,
        162,
        120
      ],
      "accounts": [
        {
          "name": "user",
          "signer": true,
          "relations": [
            "userAccount"
          ]
        },
        {
          "name": "userAccount",
          "writable": true
        },
        {
          "name": "lendingMarket",
          "writable": true,
          "relations": [
            "userAccount"
          ]
        },
        {
          "name": "collateralMint",
          "writable": true
        },
        {
          "name": "userCollateralTokenAccount",
          "writable": true
        },
        {
          "name": "collateralVault",
          "writable": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": [
        {
          "name": "collateralAmount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "fundLoanVault",
      "discriminator": [
        253,
        17,
        150,
        206,
        74,
        253,
        123,
        116
      ],
      "accounts": [
        {
          "name": "authority",
          "signer": true
        },
        {
          "name": "lendingMarket",
          "writable": true
        },
        {
          "name": "loanMint",
          "writable": true
        },
        {
          "name": "loanVault",
          "writable": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "initializeLendingMarket",
      "discriminator": [
        138,
        174,
        14,
        19,
        121,
        176,
        216,
        39
      ],
      "accounts": [
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "lendingMarket",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  108,
                  101,
                  110,
                  100,
                  105,
                  110,
                  103,
                  45,
                  109,
                  97,
                  114,
                  107,
                  101,
                  116,
                  45,
                  118,
                  50
                ]
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "collateralMint",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  108,
                  108,
                  97,
                  116,
                  101,
                  114,
                  97,
                  108,
                  45,
                  109,
                  105,
                  110,
                  116,
                  45,
                  118,
                  50
                ]
              },
              {
                "kind": "account",
                "path": "lendingMarket"
              }
            ]
          }
        },
        {
          "name": "collateralVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  108,
                  108,
                  97,
                  116,
                  101,
                  114,
                  97,
                  108,
                  45,
                  118,
                  97,
                  117,
                  108,
                  116,
                  45,
                  118,
                  50
                ]
              },
              {
                "kind": "account",
                "path": "lendingMarket"
              }
            ]
          }
        },
        {
          "name": "loanMint",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  108,
                  111,
                  97,
                  110,
                  45,
                  109,
                  105,
                  110,
                  116,
                  45,
                  118,
                  50
                ]
              },
              {
                "kind": "account",
                "path": "lendingMarket"
              }
            ]
          }
        },
        {
          "name": "loanVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  108,
                  111,
                  97,
                  110,
                  45,
                  118,
                  97,
                  117,
                  108,
                  116,
                  45,
                  118,
                  50
                ]
              },
              {
                "kind": "account",
                "path": "lendingMarket"
              }
            ]
          }
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "lendingMarket",
      "discriminator": [
        246,
        114,
        50,
        98,
        72,
        157,
        28,
        120
      ]
    },
    {
      "name": "userAccount",
      "discriminator": [
        211,
        33,
        136,
        16,
        186,
        110,
        242,
        127
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "userCollateralOverflow",
      "msg": "User's collateral amount has overflowed"
    },
    {
      "code": 6001,
      "name": "userBorrowOverflow",
      "msg": "User's borrow amount has overflowed"
    },
    {
      "code": 6002,
      "name": "marketBorrowOverflow",
      "msg": "Lending market's borrow amount has overflowed"
    },
    {
      "code": 6003,
      "name": "userMaxBorrowExceeded",
      "msg": "User's total borrow amount will exceed the maximum allowable borrow"
    },
    {
      "code": 6004,
      "name": "marketCollateralOverflow",
      "msg": "Lending market's total collateral has overflowed"
    },
    {
      "code": 6005,
      "name": "mismatchedCollateralVaultOwner",
      "msg": "The lending market does not own the provided collateral vault"
    },
    {
      "code": 6006,
      "name": "mistmatchedCollateralMint",
      "msg": "The provided collateral mint does not match the lending market's collateral mint"
    },
    {
      "code": 6007,
      "name": "mismatchedLoanVaultOwner",
      "msg": "The lending market does not own the provided loan vault"
    },
    {
      "code": 6008,
      "name": "mismatchedCollateralTokenAccountOwner",
      "msg": "The user does not own the provided collateral token account"
    },
    {
      "code": 6009,
      "name": "identicalCollateralAndLoanMints",
      "msg": "Collateral and loan mints cannnot be the same"
    },
    {
      "code": 6010,
      "name": "insufficientLoanVaultLiquidity",
      "msg": "Lending market does not have enough tokens in the loan vault to lend out"
    }
  ],
  "types": [
    {
      "name": "lendingMarket",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "collateralMint",
            "type": "pubkey"
          },
          {
            "name": "loanMint",
            "type": "pubkey"
          },
          {
            "name": "collateralVault",
            "type": "pubkey"
          },
          {
            "name": "loanVault",
            "type": "pubkey"
          },
          {
            "name": "interestRateBps",
            "type": "u16"
          },
          {
            "name": "collateralRatioBps",
            "type": "u16"
          },
          {
            "name": "collateralAmount",
            "type": "u64"
          },
          {
            "name": "borrowedAmount",
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "userAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "user",
            "type": "pubkey"
          },
          {
            "name": "lendingMarket",
            "type": "pubkey"
          },
          {
            "name": "depositedCollateralAmount",
            "type": "u64"
          },
          {
            "name": "borrowedAmount",
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    }
  ]
};
