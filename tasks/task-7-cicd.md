# Task 7: CI/CD

## Objective
Set up GitHub Actions workflows for continuous integration, testing, and package publishing.

## Prerequisites
- Task 1 completed and approved
- All other tasks completed (for full CI coverage)

---

## 7.1 CI Workflow

### .github/workflows/ci.yml

**Triggers:**
- Push to `main` branch
- Pull requests to `main` branch

**Jobs:**

#### Job 1: Lint & Type Check
```yaml
lint:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: pnpm/action-setup@v3
      with:
        version: 9
    - uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'pnpm'
    - run: pnpm install --frozen-lockfile
    - run: pnpm lint
    - run: pnpm typecheck
```

#### Job 2: Build
```yaml
build:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: pnpm/action-setup@v3
    - uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'pnpm'
    - run: pnpm install --frozen-lockfile
    - run: pnpm build
    - uses: actions/upload-artifact@v4
      with:
        name: build-artifacts
        path: packages/*/dist
```

#### Job 3: Unit Tests
```yaml
test:
  runs-on: ubuntu-latest
  needs: build
  steps:
    - uses: actions/checkout@v4
    - uses: pnpm/action-setup@v3
    - uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'pnpm'
    - run: pnpm install --frozen-lockfile
    - run: pnpm test:coverage
    - uses: codecov/codecov-action@v4
      with:
        files: ./coverage/coverage-final.json
        fail_ci_if_error: false
```

#### Job 4: E2E Tests (Optional, on main only)
```yaml
e2e:
  runs-on: ubuntu-latest
  needs: build
  if: github.ref == 'refs/heads/main'
  steps:
    - uses: actions/checkout@v4
    - uses: pnpm/action-setup@v3
    - uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'pnpm'
    - run: pnpm install --frozen-lockfile
    - run: pnpm test:e2e
      env:
        API_BASE_URL: ${{ secrets.API_BASE_URL }}
        BLOCKCHAIN_RPC_URL: ${{ secrets.BLOCKCHAIN_RPC_URL }}
        BLOCKCHAIN_CHAIN_ID: ${{ secrets.BLOCKCHAIN_CHAIN_ID }}
        BLOCKCHAIN_PAYMENT_TOKEN_ADDRESS: ${{ secrets.BLOCKCHAIN_PAYMENT_TOKEN_ADDRESS }}
        TEST_PRIVATE_KEY: ${{ secrets.TEST_PRIVATE_KEY }}
```

---

## 7.2 Release Workflow

### .github/workflows/release.yml

**Triggers:**
- Push of version tags (`v*`)

**Jobs:**

#### Job: Publish to npm
```yaml
name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  publish:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      id-token: write
    steps:
      - uses: actions/checkout@v4
      
      - uses: pnpm/action-setup@v3
        with:
          version: 9
          
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
          registry-url: 'https://registry.npmjs.org'
          
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
      - run: pnpm test
      
      # Publish packages
      - run: pnpm -r publish --access public --no-git-checks
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
          
      # Create GitHub Release
      - uses: softprops/action-gh-release@v2
        with:
          generate_release_notes: true
```

---

## 7.3 PR Checks

### .github/workflows/pr.yml

**Triggers:**
- Pull request events

**Additional Checks:**
```yaml
name: PR Checks

on:
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  # Check package size
  size:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
      - name: Check bundle size
        run: |
          SDK_SIZE=$(du -sb packages/sdk/dist | cut -f1)
          if [ $SDK_SIZE -gt 150000 ]; then
            echo "SDK bundle too large: $SDK_SIZE bytes (max 150KB)"
            exit 1
          fi
          echo "SDK bundle size: $SDK_SIZE bytes"
```

---

## 7.4 Dependabot Configuration

### .github/dependabot.yml

```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    groups:
      dev-dependencies:
        patterns:
          - "*"
        exclude-patterns:
          - "viem"
          - "react*"
          - "@tanstack/*"
    open-pull-requests-limit: 10
```

---

## 7.5 Repository Settings

### Branch Protection (document for manual setup)

For `main` branch:
- Require pull request reviews (1 approval)
- Require status checks to pass:
  - `lint`
  - `build`
  - `test`
- Require branches to be up to date
- Do not allow bypassing the above settings

### Secrets Required (document for manual setup)

| Secret | Description |
|--------|-------------|
| `NPM_TOKEN` | npm automation token for publishing |
| `API_BASE_URL` | Backend API URL for E2E tests |
| `BLOCKCHAIN_RPC_URL` | RPC URL for E2E tests |
| `BLOCKCHAIN_CHAIN_ID` | Chain ID for E2E tests |
| `BLOCKCHAIN_PAYMENT_TOKEN_ADDRESS` | Token address for E2E tests |
| `TEST_PRIVATE_KEY` | Private key for E2E test wallet |

---

## 7.6 Package Configuration Updates

### Update root package.json
```json
{
  "scripts": {
    "prepublishOnly": "pnpm build && pnpm test",
    "release": "pnpm version && git push --follow-tags"
  }
}
```

### Update SDK package.json
```json
{
  "publishConfig": {
    "access": "public"
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/your-org/x402-ups-sdk.git"
  }
}
```

---

## Acceptance Criteria

- [ ] CI workflow runs on push and PR
- [ ] All jobs pass (lint, build, test)
- [ ] Coverage report uploads to Codecov (or similar)
- [ ] Release workflow publishes to npm on tag
- [ ] PR checks include bundle size check
- [ ] Dependabot configured for dependency updates
- [ ] All required secrets documented
- [ ] Branch protection rules documented

## Verification

1. Create a test PR and verify:
   - All CI jobs run
   - Status checks appear on PR
   - Build artifacts are created

2. Test release (on a pre-release tag):
   ```bash
   git tag v0.1.0-beta.1
   git push --tags
   ```
   - Verify workflow runs
   - Verify package appears on npm (or dry-run)

## Notes
- E2E tests only run on main to avoid secret exposure in PRs
- Consider adding workflow_dispatch for manual E2E runs
- npm publish requires `NPM_TOKEN` secret configured
- Bundle size limits may need adjustment based on actual sizes
