export SHELL:=/bin/bash
.PHONY: install-deps gen-wallet set-cluster-url show-network-config

export RENEC_TESTNET_URL:= https://api-testnet.renec.foundation:8899/
export RENEC_MAINNET_URL:= https://api-mainnet-beta.renec.foundation:8899/
export RENEC_LOCALNET_URL:= http://127.0.0.1:8899
export PATH:=$(HOME)/.local/share/solana/install/active_release/bin:$(PATH)

CLUSTER ?= testnet

export REEARN_PROGRAM?=reearn_program

export CLUSTER_URL := $(if $(filter testnet,$(CLUSTER)),$(RENEC_TESTNET_URL),\
                 $(if $(filter mainnet,$(CLUSTER)),$(RENEC_MAINNET_URL),\
                 $(if $(filter localnet,$(CLUSTER)),$(RENEC_LOCALNET_URL),\
                 $(error Unknown cluster name: $(CLUSTER)))))

export CLI_VERSION := 1.14.6

show-network-config:
	@echo "interacting with cluster: $(CLUSTER_URL), CLI_VERSION: $(CLI_VERSION)"

install-deps: show-network-config
	@. ./dev-scripts/install-program-deps.sh

localnet:
	@$(MAKE) install-deps CLI_VERSION=1.9.29
	solana-test-validator --reset

gen-wallet: install-deps
	@./dev-scripts/gen-wallet.sh "$(name)"

import-wallet: install-deps
	./dev-scripts/import-wallet.sh "$(name)"

faucet: 
	@$(MAKE) install-deps CLI_VERSION=$(CLI_VERSION)
	@./dev-scripts/faucet.sh --name "$(name)" $(amount)

build: 
	@$(MAKE) install-deps CLI_VERSION=1.14.6 ANCHOR_VERSION=0.25.0		
	@./dev-scripts/build.sh "$(program_id)"
	
deploy: set-cluster-url
	@$(MAKE) install-deps CLI_VERSION=$(CLI_VERSION)
	@./dev-scripts/deploy.sh "$(deployer)" "$(program_id)"

port-dapp: 
	@$(MAKE) install-deps CLI_VERSION=$(CLI_VERSION)
	@./dev-scripts/port-program.sh "$(program_file_path)" "$(keypair_path)" "$(program_id_keypair)"
	