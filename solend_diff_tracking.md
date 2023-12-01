# Solend Diff Tracking

## Overview

This document tracks the changes made to the Solend source code.

## Change Log

### [Version 1.0.0] - 2023-12-01

- [Added] Integrate with RENEC oracle to fetch token price [oracles.rs](./token-lending/sdk/src/oracles.ts).
- [Modified] Remove Pyth, Swithboard oracle validation, and integration logic since we don't have these on RENEC.
- [Added] Add Make script and cli to support for build, deploy, init market, init/update reserve, add supply and withdraw from specific reserve.

### [Version 0.1.0] - 2023-10-19

- [Added] Folked from Solend source code at commit [8674673](https://github.com/solendprotocol/solana-program-library/commit/86746738e3c8289db6c18d2a0f2f6b421c74a2f1)