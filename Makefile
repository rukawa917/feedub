# ============================================================================
# Feedub — Makefile for Local Development
# ============================================================================
# Quick Start:
#   make help              # Show all available commands
#   make setup             # One-time setup (backend + frontend + database)
#   make dev               # Start both backend and frontend
#   make test              # Run all tests
# ============================================================================

.PHONY: help setup backend-install frontend-install check-env
.PHONY: dev backend-dev frontend-dev
.PHONY: db-migrate db-migration-create db-migration-downgrade db-reset
.PHONY: test backend-test frontend-test frontend-test-e2e frontend-test-e2e-smoke
.PHONY: lint backend-lint backend-lint-check frontend-lint frontend-lint-check
.PHONY: frontend-build frontend-preview
.PHONY: clean
.DEFAULT_GOAL := help

# ============================================================================
# Variables
# ============================================================================

# Force mode for automation (skip interactive confirmations)
FORCE ?= false

# Colors for output
COLOR_RESET   := \033[0m
COLOR_INFO    := \033[36m
COLOR_SUCCESS := \033[32m
COLOR_WARNING := \033[33m
COLOR_ERROR   := \033[31m

# Directories
BACKEND_DIR   := backend
FRONTEND_DIR  := frontend

# Python/uv
PYTHON        := uv run python
UV            := uv
PYTEST        := uv run pytest
RUFF          := uv run ruff
TY            := uv run ty
ALEMBIC       := uv run alembic

# Node/npm
NPM           := npm

# Environment
ENV_FILE      := .env

# ============================================================================
# Help
# ============================================================================

help: ## Show this help message
	@echo "$(COLOR_INFO)Feedub — Development Commands$(COLOR_RESET)"
	@echo ""
	@echo "$(COLOR_SUCCESS)Quick Start:$(COLOR_RESET)"
	@echo "  make setup         # One-time setup (backend + frontend + database)"
	@echo "  make dev           # Start both backend and frontend"
	@echo "  make test          # Run all tests"
	@echo ""
	@echo "$(COLOR_SUCCESS)Available Commands:$(COLOR_RESET)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  $(COLOR_INFO)%-20s$(COLOR_RESET) %s\n", $$1, $$2}'
	@echo ""

# ============================================================================
# Setup & Installation
# ============================================================================

setup: ## One-time setup: install dependencies, initialize SQLite DB, run migrations
	@echo "$(COLOR_INFO)Setting up Feedub...$(COLOR_RESET)"
	@$(MAKE) backend-install
	@$(MAKE) frontend-install
	@$(MAKE) db-migrate
	@echo "$(COLOR_SUCCESS)✓ Setup complete! Run 'make dev' to start development.$(COLOR_RESET)"

backend-install: ## Install backend dependencies
	@echo "$(COLOR_INFO)Installing backend dependencies...$(COLOR_RESET)"
	@cd $(BACKEND_DIR) && $(UV) sync --extra dev
	@echo "$(COLOR_SUCCESS)✓ Backend dependencies installed$(COLOR_RESET)"

frontend-install: ## Install frontend dependencies
	@echo "$(COLOR_INFO)Installing frontend dependencies...$(COLOR_RESET)"
	@cd $(FRONTEND_DIR) && $(NPM) install
	@echo "$(COLOR_SUCCESS)✓ Frontend dependencies installed$(COLOR_RESET)"

check-env: ## Check if .env file exists
	@if [ ! -f $(ENV_FILE) ]; then \
		echo "$(COLOR_ERROR)Error: $(ENV_FILE) not found!$(COLOR_RESET)"; \
		echo "$(COLOR_WARNING)Copy $(ENV_FILE).example to $(ENV_FILE) and configure it:$(COLOR_RESET)"; \
		echo "  cp .env.example .env"; \
		exit 1; \
	fi

# ============================================================================
# Development
# ============================================================================

dev: ## Start both backend and frontend in parallel
	@echo "$(COLOR_INFO)Starting Feedub in development mode...$(COLOR_RESET)"
	@echo "$(COLOR_WARNING)Backend: http://localhost:8000$(COLOR_RESET)"
	@echo "$(COLOR_WARNING)Frontend: http://localhost:5173$(COLOR_RESET)"
	@echo "$(COLOR_WARNING)API Docs: http://localhost:8000/docs$(COLOR_RESET)"
	@$(MAKE) -j2 backend-dev frontend-dev

backend-dev: check-env ## Start FastAPI development server
	@echo "$(COLOR_INFO)Starting backend dev server...$(COLOR_RESET)"
	@cd $(BACKEND_DIR) && $(UV) run uvicorn src.main:app --reload --host 0.0.0.0 --port 8000

frontend-dev: ## Start Vite development server
	@echo "$(COLOR_INFO)Starting frontend dev server...$(COLOR_RESET)"
	@cd $(FRONTEND_DIR) && $(NPM) run dev

# ============================================================================
# Database Management (SQLite + Alembic)
# ============================================================================

db-migrate: check-env ## Run Alembic migrations
	@echo "$(COLOR_INFO)Running database migrations...$(COLOR_RESET)"
	@cd $(BACKEND_DIR) && $(ALEMBIC) upgrade head
	@echo "$(COLOR_SUCCESS)✓ Database migrated$(COLOR_RESET)"

db-migration-create: ## Create a new Alembic migration (usage: make db-migration-create MSG="description")
	@if [ -z "$(MSG)" ]; then \
		echo "$(COLOR_ERROR)Error: MSG is required!$(COLOR_RESET)"; \
		echo "$(COLOR_WARNING)Usage: make db-migration-create MSG=\"add user table\"$(COLOR_RESET)"; \
		exit 1; \
	fi
	@echo "$(COLOR_INFO)Creating new migration: $(MSG)$(COLOR_RESET)"
	@cd $(BACKEND_DIR) && $(ALEMBIC) revision --autogenerate -m "$(MSG)"
	@echo "$(COLOR_SUCCESS)✓ Migration created in $(BACKEND_DIR)/alembic/versions/$(COLOR_RESET)"
	@echo "$(COLOR_WARNING)Review the migration before applying!$(COLOR_RESET)"

db-migration-downgrade: ## Downgrade database by 1 migration (WARNING: use with caution)
	@echo "$(COLOR_WARNING)WARNING: This will rollback the last migration!$(COLOR_RESET)"
	@if [ "$(FORCE)" != "true" ]; then \
		read -p "Are you sure? (y/N): " confirm && [ "$$confirm" = "y" ] || exit 1; \
	fi
	@cd $(BACKEND_DIR) && $(ALEMBIC) downgrade -1
	@echo "$(COLOR_SUCCESS)✓ Downgraded by 1 migration$(COLOR_RESET)"

db-reset: ## Reset database (WARNING: deletes all data)
	@echo "$(COLOR_WARNING)WARNING: This will delete all database data!$(COLOR_RESET)"
	@if [ "$(FORCE)" != "true" ]; then \
		read -p "Are you sure? (y/N): " confirm && [ "$$confirm" = "y" ] || exit 1; \
	fi
	@rm -f $(BACKEND_DIR)/data/feedub.db
	@$(MAKE) db-migrate
	@echo "$(COLOR_SUCCESS)✓ Database reset complete$(COLOR_RESET)"

# ============================================================================
# Testing
# ============================================================================

test: ## Run all tests (backend + frontend)
	@$(MAKE) backend-test
	@$(MAKE) frontend-test
	@echo "$(COLOR_SUCCESS)✓ All tests passed$(COLOR_RESET)"

backend-test: ## Run all backend tests
	@echo "$(COLOR_INFO)Running backend tests...$(COLOR_RESET)"
	@cd $(BACKEND_DIR) && $(PYTEST) tests/ -v
	@echo "$(COLOR_SUCCESS)✓ Backend tests passed$(COLOR_RESET)"

frontend-test: ## Run frontend tests
	@echo "$(COLOR_INFO)Running frontend tests...$(COLOR_RESET)"
	@cd $(FRONTEND_DIR) && $(NPM) test run
	@echo "$(COLOR_SUCCESS)✓ Frontend tests passed$(COLOR_RESET)"

frontend-test-e2e: ## Run frontend E2E tests (requires: make dev in another terminal)
	@echo "$(COLOR_INFO)Running frontend E2E tests...$(COLOR_RESET)"
	@echo "$(COLOR_WARNING)Note: Requires 'make dev' running in another terminal$(COLOR_RESET)"
	@cd $(FRONTEND_DIR) && $(NPM) run test:e2e

frontend-test-e2e-smoke: ## Run only deployment smoke tests (no auth required)
	@echo "$(COLOR_INFO)Running deployment smoke tests...$(COLOR_RESET)"
	@cd $(FRONTEND_DIR) && $(NPM) run test:e2e:smoke

# ============================================================================
# Code Quality
# ============================================================================

lint: ## Run linting for both backend and frontend
	@$(MAKE) backend-lint
	@$(MAKE) frontend-lint
	@echo "$(COLOR_SUCCESS)✓ All linting passed$(COLOR_RESET)"

backend-lint: ## Lint and format backend code
	@echo "$(COLOR_INFO)Linting backend code...$(COLOR_RESET)"
	@cd $(BACKEND_DIR) && $(RUFF) format .
	@cd $(BACKEND_DIR) && $(RUFF) check . --fix
	@cd $(BACKEND_DIR) && $(TY) check
	@echo "$(COLOR_SUCCESS)✓ Backend linting complete$(COLOR_RESET)"

backend-lint-check: ## Check backend code without auto-fixing
	@echo "$(COLOR_INFO)Checking backend code...$(COLOR_RESET)"
	@cd $(BACKEND_DIR) && $(RUFF) format --check .
	@cd $(BACKEND_DIR) && $(RUFF) check .

frontend-lint: ## Lint and format frontend code
	@echo "$(COLOR_INFO)Linting frontend code...$(COLOR_RESET)"
	@cd $(FRONTEND_DIR) && $(NPM) run format
	@cd $(FRONTEND_DIR) && $(NPM) run lint:fix
	@cd $(FRONTEND_DIR) && $(NPM) run type-check
	@echo "$(COLOR_SUCCESS)✓ Frontend linting complete$(COLOR_RESET)"

frontend-lint-check: ## Check frontend code without auto-fixing
	@echo "$(COLOR_INFO)Checking frontend code...$(COLOR_RESET)"
	@cd $(FRONTEND_DIR) && $(NPM) run format:check
	@cd $(FRONTEND_DIR) && $(NPM) run lint
	@cd $(FRONTEND_DIR) && $(NPM) run type-check

# ============================================================================
# Build
# ============================================================================

frontend-build: ## Build frontend for production
	@echo "$(COLOR_INFO)Building frontend...$(COLOR_RESET)"
	@cd $(FRONTEND_DIR) && $(NPM) run build
	@echo "$(COLOR_SUCCESS)✓ Frontend built to $(FRONTEND_DIR)/dist/$(COLOR_RESET)"

frontend-preview: frontend-build ## Preview production frontend build locally
	@echo "$(COLOR_INFO)Starting frontend preview server...$(COLOR_RESET)"
	@cd $(FRONTEND_DIR) && $(NPM) run preview

# ============================================================================
# Cleanup
# ============================================================================

clean: ## Clean build artifacts and caches
	@echo "$(COLOR_INFO)Cleaning build artifacts...$(COLOR_RESET)"
	@rm -rf $(BACKEND_DIR)/.pytest_cache
	@rm -rf $(BACKEND_DIR)/.ruff_cache
	@rm -rf $(BACKEND_DIR)/htmlcov
	@rm -rf $(BACKEND_DIR)/.coverage
	@rm -rf $(FRONTEND_DIR)/dist
	@rm -rf $(FRONTEND_DIR)/node_modules/.vite
	@rm -rf $(FRONTEND_DIR)/.vitest
	@echo "$(COLOR_SUCCESS)✓ Cleanup complete$(COLOR_RESET)"
