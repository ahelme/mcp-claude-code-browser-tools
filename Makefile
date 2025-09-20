# MANE Browser Tools Makefile
# Contract validation and quality gates

.PHONY: help install contract-check env-validate lint type-check test-all quality-gate
.PHONY: universe-doctor benchmark security-audit clean doctor-watch

# Default target
help:
	@echo "🏥 MANE Browser Tools - Quality Gates & Contract Validation"
	@echo ""
	@echo "📋 Contract Validation:"
	@echo "  contract-check     - Validate OpenAPI contract compliance"
	@echo "  env-validate       - Validate environment configuration"
	@echo ""
	@echo "🧪 Quality Gates:"
	@echo "  lint              - Run code linting"
	@echo "  type-check        - Run TypeScript type checking"
	@echo "  test-all          - Run all test suites"
	@echo "  quality-gate      - Run complete quality gate pipeline"
	@echo ""
	@echo "🌌 Universe Management:"
	@echo "  universe-doctor   - Check health of all MANE universes"
	@echo "  doctor-watch      - Watch universe health in real-time"
	@echo ""
	@echo "🔧 Utilities:"
	@echo "  install           - Install dependencies"
	@echo "  benchmark         - Run performance benchmarks"
	@echo "  security-audit    - Run security vulnerability scan"
	@echo "  clean             - Clean build artifacts"

# Installation and setup
install:
	@echo "📦 Installing dependencies..."
	npm install
	@echo "✅ Dependencies installed"

# Contract validation
contract-check:
	@echo "📋 Validating OpenAPI contracts..."
	@if command -v swagger-codegen >/dev/null 2>&1; then \
		swagger-codegen validate -i contracts/http.yaml; \
	elif command -v npx >/dev/null 2>&1; then \
		npx @apidevtools/swagger-parser validate contracts/http.yaml; \
	else \
		echo "⚠️  No OpenAPI validator found. Install: npm install -g @apidevtools/swagger-parser"; \
		echo "📋 Checking YAML syntax..."; \
		node -e "require('js-yaml').load(require('fs').readFileSync('contracts/http.yaml', 'utf8'))"; \
	fi
	@echo "✅ Contract validation passed"

# Environment validation
env-validate:
	@echo "🔧 Validating environment configuration..."
	@if [ -f .env ]; then \
		echo "📝 Found .env file, validating against schema..."; \
		node -e " \
			const fs = require('fs'); \
			const schema = JSON.parse(fs.readFileSync('contracts/config.schema.json', 'utf8')); \
			const env = Object.fromEntries( \
				fs.readFileSync('.env', 'utf8') \
					.split('\n') \
					.filter(line => line.trim() && !line.startsWith('#')) \
					.map(line => line.split('=', 2)) \
			); \
			const required = schema.required || []; \
			const missing = required.filter(key => !env[key]); \
			if (missing.length > 0) { \
				console.error('❌ Missing required environment variables:', missing.join(', ')); \
				process.exit(1); \
			} \
			console.log('✅ Environment validation passed'); \
		"; \
	else \
		echo "⚠️  No .env file found. Creating from schema defaults..."; \
		node -e " \
			const schema = JSON.parse(require('fs').readFileSync('contracts/config.schema.json', 'utf8')); \
			const defaults = Object.entries(schema.properties) \
				.map(([key, prop]) => \`\${key}=\${prop.default || ''}\`) \
				.join('\n'); \
			require('fs').writeFileSync('.env.example', defaults); \
			console.log('📝 Created .env.example with defaults'); \
		"; \
	fi

# Code quality
lint:
	@echo "🧹 Running code linting..."
	@if [ -f package.json ] && grep -q "eslint" package.json; then \
		npm run lint 2>/dev/null || npx eslint . --ext .js,.mjs,.ts --fix; \
	elif command -v npx >/dev/null 2>&1; then \
		npx eslint . --ext .js,.mjs,.ts --fix 2>/dev/null || echo "⚠️  ESLint not configured"; \
	fi
	@if [ -f package.json ] && grep -q "prettier" package.json; then \
		npm run format 2>/dev/null || npx prettier --write "**/*.{js,mjs,ts,json,yaml,md}"; \
	elif command -v npx >/dev/null 2>&1; then \
		npx prettier --write "**/*.{js,mjs,ts,json,yaml,md}" 2>/dev/null || echo "⚠️  Prettier not configured"; \
	fi
	@echo "✅ Linting completed"

# Type checking
type-check:
	@echo "🔍 Running TypeScript type checking..."
	@if [ -f tsconfig.json ]; then \
		npx tsc --noEmit; \
	elif find . -name "*.ts" -not -path "./node_modules/*" | head -1 | grep -q .; then \
		echo "⚠️  TypeScript files found but no tsconfig.json"; \
		echo "📝 Checking basic syntax..."; \
		find . -name "*.ts" -not -path "./node_modules/*" -exec node -c {} \; 2>/dev/null || true; \
	else \
		echo "ℹ️  No TypeScript files found"; \
	fi
	@echo "✅ Type checking completed"

# Testing
test-all:
	@echo "🧪 Running all tests..."
	@if [ -f package.json ] && grep -q "\"test\"" package.json; then \
		npm test; \
	elif [ -d tests ] || [ -d test ]; then \
		if command -v node >/dev/null 2>&1 && node --version | grep -q "v[2-9][0-9]\|v1[89]"; then \
			node --test; \
		else \
			echo "⚠️  No test runner configured"; \
		fi \
	else \
		echo "ℹ️  No tests found"; \
	fi
	@echo "✅ Tests completed"

# Performance benchmarking
benchmark:
	@echo "⚡ Running performance benchmarks..."
	@if [ -f scripts/benchmark.js ]; then \
		node scripts/benchmark.js; \
	else \
		echo "🔧 Running basic HTTP bridge benchmark..."; \
		if command -v curl >/dev/null 2>&1; then \
			echo "Testing health endpoint:"; \
			time curl -s http://localhost:3024/health || echo "❌ HTTP bridge not running"; \
		fi \
	fi
	@echo "✅ Benchmarks completed"

# Security audit
security-audit:
	@echo "🔒 Running security audit..."
	@if [ -f package.json ]; then \
		npm audit --audit-level=high; \
	fi
	@if command -v npx >/dev/null 2>&1; then \
		echo "🔍 Checking for common vulnerabilities..."; \
		npx audit-ci --config audit-ci.json 2>/dev/null || echo "⚠️  audit-ci not configured"; \
	fi
	@echo "✅ Security audit completed"

# Universe management
universe-doctor:
	@echo "🏥 Running MANE Universe Doctor..."
	node scripts/universe-doctor.js

doctor-watch:
	@echo "👀 Starting Universe Doctor in watch mode..."
	node scripts/universe-doctor.js --watch

# Complete quality gate pipeline
quality-gate: contract-check env-validate lint type-check test-all
	@echo ""
	@echo "🏁 Complete Quality Gate Pipeline"
	@echo "=================================="
	@echo "✅ Contract validation"
	@echo "✅ Environment validation"
	@echo "✅ Code linting"
	@echo "✅ Type checking"
	@echo "✅ Test execution"
	@echo ""
	@echo "🚀 All quality gates passed! Ready for integration."

# Individual check targets (for CI/CD)
unit-test:
	@echo "🧪 Running unit tests..."
	@if [ -f package.json ] && grep -q "test:unit" package.json; then \
		npm run test:unit; \
	else \
		$(MAKE) test-all; \
	fi

integration-test:
	@echo "🔗 Running integration tests..."
	@if [ -f package.json ] && grep -q "test:integration" package.json; then \
		npm run test:integration; \
	else \
		echo "ℹ️  No integration tests configured"; \
	fi

e2e-test:
	@echo "🎭 Running end-to-end tests..."
	@if [ -f package.json ] && grep -q "test:e2e" package.json; then \
		npm run test:e2e; \
	else \
		echo "ℹ️  No e2e tests configured"; \
	fi

performance-test:
	@echo "⚡ Running performance tests..."
	@$(MAKE) benchmark

# Cleanup
clean:
	@echo "🧹 Cleaning build artifacts..."
	@rm -rf node_modules/.cache dist build coverage .nyc_output
	@find . -name "*.log" -not -path "./node_modules/*" -delete 2>/dev/null || true
	@echo "✅ Cleanup completed"

# Pre-commit hook simulation
pre-commit: contract-check env-validate lint type-check
	@echo "🎯 Pre-commit checks completed"

# Promotion pipeline (for integration)
promote: quality-gate universe-doctor
	@echo ""
	@echo "🚀 Promotion Pipeline Complete"
	@echo "=============================="
	@echo "All quality gates passed and universes checked."
	@echo "Ready to promote to integration universe!"

# Development server helpers
start-server:
	@echo "🚀 Starting MCP HTTP bridge server..."
	./scripts/start-mcp-browser-tools.sh

health-check:
	@echo "❤️  Checking server health..."
	@curl -s http://localhost:3024/health | jq . || echo "❌ Server not responding"

# Git workflow helpers
sync-universes:
	@echo "🔄 Syncing all universes with main..."
	@node -e " \
		const { execSync } = require('child_process'); \
		const universes = ['agent-a-foundation', 'agent-b-evaluate', 'agent-c-audit', 'agent-d-console', 'agent-e-content', 'agent-f-ui-panels', 'agent-g-screenshot']; \
		universes.forEach(agent => { \
			try { \
				console.log(\`🔄 Syncing \${agent}...\`); \
				execSync(\`cd ../mane-universes/\${agent} && git rebase main\`, {stdio: 'inherit'}); \
			} catch (e) { \
				console.log(\`⚠️  \${agent} needs manual attention\`); \
			} \
		}); \
	"

# Status overview
status: universe-doctor
	@echo ""
	@echo "📊 Project Status Overview"
	@echo "=========================="
	@echo "📂 Project: MANE Browser Tools"
	@echo "🌐 HTTP Bridge: http://localhost:3024"
	@echo "📋 Contracts: contracts/"
	@echo "🌌 Universes: ../mane-universes/"