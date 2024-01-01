export SHELL:=/bin/bash
.PHONY: install-deps gen-wallet set-cluster-url show-network-config

export RENEC_TESTNET_URL:= https://api-testnet.renec.foundation:8899/
export RENEC_MAINNET_URL:= https://api-mainnet-beta.renec.foundation:8899/
export RENEC_LOCALNET_URL:= http://127.0.0.1:8899
export PATH:=$(HOME)/.local/share/solana/install/active_release/bin:$(PATH)

CLUSTER ?= testnet

export WALLET_PATH:=.wallets
export PROGRAM_NAME?=relend-program
export REEARN_PROGRAM?=reearn_program

export CLUSTER_URL := $(if $(filter testnet,$(CLUSTER)),$(RENEC_TESTNET_URL),\
                 $(if $(filter mainnet,$(CLUSTER)),$(RENEC_MAINNET_URL),\
                 $(if $(filter localnet,$(CLUSTER)),$(RENEC_LOCALNET_URL),\
                 $(error Unknown cluster name: $(CLUSTER)))))

export CLI_VERSION := 1.14.6
export ANCHOR_VERSION := 0.25.0

install-deps: show-network-config
	@. ./scripts/install-program-deps.sh

build: 
	@$(MAKE) install-deps CLI_VERSION=$(CLI_VERSION) ANCHOR_VERSION=$(ANCHOR_VERSION)
	@./scripts/build.sh "$(program_id)"

build-re:
	cd reearn && make build $(program_id)
	
deploy-re:
	cd reearn && make deploy "$(deployer)"

deploy: set-cluster-url
	@./scripts/deploy.sh "$(deployer)"

init-market:
	@./scripts/init-market.sh "$(program_id)" "$(owner)" "$(payer)"

update-reserve:
	@./scripts/update-reserve.sh "$(program_id)" "$(owner)" "$(market)" "$(reserve)" "$(borrow_fee)"