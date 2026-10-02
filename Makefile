# Amber Stash — Docker dev workflow shortcuts
# Windows 使用者：需要先裝 make（推薦 `winget install GnuWin32.Make` 或 `choco install make`）
# 沒裝 make 也可以直接用 README 內列出的 `docker compose ...` 原始指令

COMPOSE      ?= docker compose
SERVICE      ?= app
CONTAINER    ?= amber-stash-dev

.DEFAULT_GOAL := help

## ────────────────────────────────────────────────────────────
## 常用
## ────────────────────────────────────────────────────────────

.PHONY: help
help: ## 列出所有 target
	@awk 'BEGIN {FS = ":.*##"; printf "\nUsage: make \033[36m<target>\033[0m\n\nTargets:\n"} \
		/^[a-zA-Z_-]+:.*?##/ { printf "  \033[36m%-14s\033[0m %s\n", $$1, $$2 } \
		/^##/ { printf "\n\033[1m%s\033[0m\n", substr($$0, 4) }' $(MAKEFILE_LIST)

.PHONY: up
up: ## 啟動 dev server (detached) — 瀏覽器開 http://localhost:8081
	$(COMPOSE) up -d
	@echo ""
	@echo "  Metro: http://localhost:8081"
	@echo "  Logs:  make logs"

.PHONY: up-fg
up-fg: ## 啟動 dev server (foreground，看即時 log，Ctrl+C 停止)
	$(COMPOSE) up

.PHONY: down
down: ## 停掉並移除 container
	$(COMPOSE) down

.PHONY: restart
restart: ## 重啟 container（不重 build）
	$(COMPOSE) restart $(SERVICE)

.PHONY: logs
logs: ## 看 dev server log（follow）
	$(COMPOSE) logs -f $(SERVICE)

.PHONY: ps
ps: ## 看 container 狀態
	$(COMPOSE) ps

## ────────────────────────────────────────────────────────────
## Build / 清理
## ────────────────────────────────────────────────────────────

.PHONY: build
build: ## Build image
	$(COMPOSE) build

.PHONY: rebuild
rebuild: ## 重 build image（不用 cache，改完 package.json 後用）
	$(COMPOSE) build --no-cache

.PHONY: clean
clean: ## 停掉 + 移除 container + 清掉 node_modules / .expo volume
	$(COMPOSE) down -v

.PHONY: nuke
nuke: clean ## 連 image 一起砍掉，全部重來
	-docker image rm amber-stash-app:latest

## ────────────────────────────────────────────────────────────
## 在 container 內跑命令
## ────────────────────────────────────────────────────────────

.PHONY: shell
shell: ## 進入 container 的 shell
	$(COMPOSE) exec $(SERVICE) bash

.PHONY: test
test: ## 跑 jest 測試
	$(COMPOSE) exec $(SERVICE) npm test

.PHONY: typecheck
typecheck: ## 跑 tsc --noEmit
	$(COMPOSE) exec $(SERVICE) npm run typecheck

.PHONY: install
install: ## 在 container 內裝套件（改完 package.json 後跑這個或 make rebuild）
	$(COMPOSE) exec $(SERVICE) npm install
