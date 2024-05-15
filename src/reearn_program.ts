export type ReearnProgram = {
  "version": "0.1.0",
  "name": "reearn_program",
  "instructions": [
    {
      "name": "initialize",
      "accounts": [
        {
          "name": "feePayer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "authority",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "configAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "vault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "bump",
          "type": "u8"
        },
        {
          "name": "vaultBump",
          "type": "u8"
        },
        {
          "name": "operator",
          "type": "publicKey"
        }
      ]
    },
    {
      "name": "changeOperator",
      "accounts": [
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "configAccount",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "newOperator",
          "type": "publicKey"
        }
      ]
    },
    {
      "name": "changeLockDuration",
      "accounts": [
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "configAccount",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "duration",
          "type": "u32"
        }
      ]
    },
    {
      "name": "refreshReward",
      "accounts": [
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "obligationReward",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "configAccount",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "obligation",
          "type": "publicKey"
        },
        {
          "name": "wallet",
          "type": "publicKey"
        },
        {
          "name": "amount",
          "type": "u64"
        },
        {
          "name": "expo",
          "type": "i8"
        }
      ]
    },
    {
      "name": "registerForEarn",
      "accounts": [
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "obligationReward",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "configAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "obligation",
          "type": "publicKey"
        },
        {
          "name": "wallet",
          "type": "publicKey"
        }
      ]
    },
    {
      "name": "claimReward",
      "accounts": [
        {
          "name": "feePayer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "authority",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "tokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "vault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "vaultTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "obligationReward",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "configAccount",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "obligation",
          "type": "publicKey"
        },
        {
          "name": "wallet",
          "type": "publicKey"
        }
      ]
    },
    {
      "name": "supply",
      "accounts": [
        {
          "name": "feePayer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "authority",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "tokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "vault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "vaultTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "configAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
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
      "name": "initReserveReward",
      "accounts": [
        {
          "name": "feePayer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "supplyApy",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "configAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "reserve",
          "type": "publicKey"
        },
        {
          "name": "reward",
          "type": "publicKey"
        },
        {
          "name": "apy",
          "type": "f32"
        },
        {
          "name": "tokenDecimals",
          "type": "u8"
        },
        {
          "name": "startTime",
          "type": "i64"
        },
        {
          "name": "endTime",
          "type": "i64"
        }
      ]
    },
    {
      "name": "closeReserveReward",
      "accounts": [
        {
          "name": "feePayer",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "CHECK"
          ]
        },
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "supplyApy",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "CHECK"
          ]
        },
        {
          "name": "configAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "reserve",
          "type": "publicKey"
        }
      ]
    },
    {
      "name": "supplyToEarn",
      "accounts": [
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "reserveReward",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "supplyApy",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "configAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "obligation",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "reserve",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "wallet",
          "type": "publicKey"
        }
      ]
    },
    {
      "name": "claimSteReward",
      "accounts": [
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "tokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "vault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "vaultTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "obligation",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "reserve",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "reserveReward",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "supplyApy",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "configAccount",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "wallet",
          "type": "publicKey"
        }
      ]
    },
    {
      "name": "changeSupplyApy",
      "accounts": [
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "supplyApy",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "configAccount",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "reward",
          "type": "publicKey"
        },
        {
          "name": "apy",
          "type": "f32"
        },
        {
          "name": "tokenDecimals",
          "type": "u8"
        },
        {
          "name": "startTime",
          "type": "i64"
        },
        {
          "name": "endTime",
          "type": "i64"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "obligationReward",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "obligationId",
            "type": "publicKey"
          },
          {
            "name": "owner",
            "type": "publicKey"
          },
          {
            "name": "lastClaimed",
            "type": "i64"
          },
          {
            "name": "rewardAmount",
            "type": "u64"
          },
          {
            "name": "exponent",
            "type": "i8"
          },
          {
            "name": "initialized",
            "type": "bool"
          },
          {
            "name": "lastUpdated",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "config",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "bump",
            "type": {
              "array": [
                "u8",
                1
              ]
            }
          },
          {
            "name": "vaultBump",
            "type": {
              "array": [
                "u8",
                1
              ]
            }
          },
          {
            "name": "admin",
            "type": "publicKey"
          },
          {
            "name": "operator",
            "type": "publicKey"
          },
          {
            "name": "lockDuration",
            "type": "u32"
          },
          {
            "name": "maxRewardPerObligation",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "reserveReward",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "obligationId",
            "type": "publicKey"
          },
          {
            "name": "owner",
            "type": "publicKey"
          },
          {
            "name": "reserve",
            "type": "publicKey"
          },
          {
            "name": "accumulatedRewardAmount",
            "type": "u64"
          },
          {
            "name": "lastSupply",
            "type": "i64"
          },
          {
            "name": "initialized",
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "supplyApy",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "reserve",
            "type": "publicKey"
          },
          {
            "name": "apy",
            "type": "f32"
          },
          {
            "name": "rewardToken",
            "type": "publicKey"
          },
          {
            "name": "tokenDecimals",
            "type": "u8"
          },
          {
            "name": "startTime",
            "type": "i64"
          },
          {
            "name": "endTime",
            "type": "i64"
          },
          {
            "name": "initialized",
            "type": "bool"
          },
          {
            "name": "reserveSpace",
            "type": {
              "array": [
                "u128",
                6
              ]
            }
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "ReearnErrorCode",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "OnlyAdmin"
          },
          {
            "name": "WrongOperator"
          },
          {
            "name": "InvalidLockDuration"
          },
          {
            "name": "ExpoPositiveNonSupport"
          },
          {
            "name": "MathOverflow"
          },
          {
            "name": "WrongObligation"
          },
          {
            "name": "WrongWallet"
          },
          {
            "name": "WrongRewardOwner"
          },
          {
            "name": "AlreadyClaimedToday"
          },
          {
            "name": "WrongReserve"
          },
          {
            "name": "WrongRewardToken"
          },
          {
            "name": "InvalidAccountOwner"
          }
        ]
      }
    }
  ]
};

export const IDL: ReearnProgram = {
  "version": "0.1.0",
  "name": "reearn_program",
  "instructions": [
    {
      "name": "initialize",
      "accounts": [
        {
          "name": "feePayer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "authority",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "configAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "vault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "bump",
          "type": "u8"
        },
        {
          "name": "vaultBump",
          "type": "u8"
        },
        {
          "name": "operator",
          "type": "publicKey"
        }
      ]
    },
    {
      "name": "changeOperator",
      "accounts": [
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "configAccount",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "newOperator",
          "type": "publicKey"
        }
      ]
    },
    {
      "name": "changeLockDuration",
      "accounts": [
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "configAccount",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "duration",
          "type": "u32"
        }
      ]
    },
    {
      "name": "refreshReward",
      "accounts": [
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "obligationReward",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "configAccount",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "obligation",
          "type": "publicKey"
        },
        {
          "name": "wallet",
          "type": "publicKey"
        },
        {
          "name": "amount",
          "type": "u64"
        },
        {
          "name": "expo",
          "type": "i8"
        }
      ]
    },
    {
      "name": "registerForEarn",
      "accounts": [
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "obligationReward",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "configAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "obligation",
          "type": "publicKey"
        },
        {
          "name": "wallet",
          "type": "publicKey"
        }
      ]
    },
    {
      "name": "claimReward",
      "accounts": [
        {
          "name": "feePayer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "authority",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "tokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "vault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "vaultTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "obligationReward",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "configAccount",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "obligation",
          "type": "publicKey"
        },
        {
          "name": "wallet",
          "type": "publicKey"
        }
      ]
    },
    {
      "name": "supply",
      "accounts": [
        {
          "name": "feePayer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "authority",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "tokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "vault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "vaultTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "configAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
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
      "name": "initReserveReward",
      "accounts": [
        {
          "name": "feePayer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "supplyApy",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "configAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "reserve",
          "type": "publicKey"
        },
        {
          "name": "reward",
          "type": "publicKey"
        },
        {
          "name": "apy",
          "type": "f32"
        },
        {
          "name": "tokenDecimals",
          "type": "u8"
        },
        {
          "name": "startTime",
          "type": "i64"
        },
        {
          "name": "endTime",
          "type": "i64"
        }
      ]
    },
    {
      "name": "closeReserveReward",
      "accounts": [
        {
          "name": "feePayer",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "CHECK"
          ]
        },
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "supplyApy",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "CHECK"
          ]
        },
        {
          "name": "configAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "reserve",
          "type": "publicKey"
        }
      ]
    },
    {
      "name": "supplyToEarn",
      "accounts": [
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "reserveReward",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "supplyApy",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "configAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "obligation",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "reserve",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "wallet",
          "type": "publicKey"
        }
      ]
    },
    {
      "name": "claimSteReward",
      "accounts": [
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "tokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "vault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "vaultTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "obligation",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "reserve",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "reserveReward",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "supplyApy",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "configAccount",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "wallet",
          "type": "publicKey"
        }
      ]
    },
    {
      "name": "changeSupplyApy",
      "accounts": [
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "supplyApy",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "configAccount",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "reward",
          "type": "publicKey"
        },
        {
          "name": "apy",
          "type": "f32"
        },
        {
          "name": "tokenDecimals",
          "type": "u8"
        },
        {
          "name": "startTime",
          "type": "i64"
        },
        {
          "name": "endTime",
          "type": "i64"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "obligationReward",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "obligationId",
            "type": "publicKey"
          },
          {
            "name": "owner",
            "type": "publicKey"
          },
          {
            "name": "lastClaimed",
            "type": "i64"
          },
          {
            "name": "rewardAmount",
            "type": "u64"
          },
          {
            "name": "exponent",
            "type": "i8"
          },
          {
            "name": "initialized",
            "type": "bool"
          },
          {
            "name": "lastUpdated",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "config",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "bump",
            "type": {
              "array": [
                "u8",
                1
              ]
            }
          },
          {
            "name": "vaultBump",
            "type": {
              "array": [
                "u8",
                1
              ]
            }
          },
          {
            "name": "admin",
            "type": "publicKey"
          },
          {
            "name": "operator",
            "type": "publicKey"
          },
          {
            "name": "lockDuration",
            "type": "u32"
          },
          {
            "name": "maxRewardPerObligation",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "reserveReward",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "obligationId",
            "type": "publicKey"
          },
          {
            "name": "owner",
            "type": "publicKey"
          },
          {
            "name": "reserve",
            "type": "publicKey"
          },
          {
            "name": "accumulatedRewardAmount",
            "type": "u64"
          },
          {
            "name": "lastSupply",
            "type": "i64"
          },
          {
            "name": "initialized",
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "supplyApy",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "reserve",
            "type": "publicKey"
          },
          {
            "name": "apy",
            "type": "f32"
          },
          {
            "name": "rewardToken",
            "type": "publicKey"
          },
          {
            "name": "tokenDecimals",
            "type": "u8"
          },
          {
            "name": "startTime",
            "type": "i64"
          },
          {
            "name": "endTime",
            "type": "i64"
          },
          {
            "name": "initialized",
            "type": "bool"
          },
          {
            "name": "reserveSpace",
            "type": {
              "array": [
                "u128",
                6
              ]
            }
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "ReearnErrorCode",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "OnlyAdmin"
          },
          {
            "name": "WrongOperator"
          },
          {
            "name": "InvalidLockDuration"
          },
          {
            "name": "ExpoPositiveNonSupport"
          },
          {
            "name": "MathOverflow"
          },
          {
            "name": "WrongObligation"
          },
          {
            "name": "WrongWallet"
          },
          {
            "name": "WrongRewardOwner"
          },
          {
            "name": "AlreadyClaimedToday"
          },
          {
            "name": "WrongReserve"
          },
          {
            "name": "WrongRewardToken"
          },
          {
            "name": "InvalidAccountOwner"
          }
        ]
      }
    }
  ]
};
