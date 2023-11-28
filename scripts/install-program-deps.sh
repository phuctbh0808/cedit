#!/usr/bin/env bash
set -e

source scripts/environments/cli-version.sh install
source scripts/environments/anchor-version.sh install
source scripts/environments/remove-renec-cli.sh

set -x
