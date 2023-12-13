export type ReearnProgram = {
  "version": "0.1.0",
  "name": "reearn_program",
  "instructions": [
    {
      "name": "initialize",
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
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "tokenAccount",
          "isMut": false,
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
          "isMut": true,
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
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "tokenAccount",
          "isMut": false,
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
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
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
          "name": "authority",
          "isMut": true,
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
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "tokenAccount",
          "isMut": false,
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
          "isMut": true,
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
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "tokenAccount",
          "isMut": false,
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
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
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
          }
        ]
      }
    }
  ]
};
