# Task 1: Project Scaffolding

## Objective
Create the monorepo structure for the x402 UPS TypeScript SDK with all necessary tooling and configurations.

---

## Deliverables

### 1.1 Repository Structure

Create a pnpm monorepo with the following structure:

```
x402-ups-sdk/
├── packages/
│   ├── sdk/                 # @x402-ups/sdk - Core library
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── client.ts
│   │   │   ├── types/
│   │   │   ├── core/        # HttpClient, AuthManager, EventBus
│   │   │   ├── wallet/      # WalletModule
│   │   │   ├── account/     # AccountModule
│   │   │   └── payment/     # PaymentModule
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── tsup.config.ts
│   ├── react/               # @x402-ups/react - React hooks
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── provider.tsx
│   │   │   ├── store.ts
│   │   │   └── hooks/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── tsup.config.ts
│   └── test-utils/          # @x402-ups/test-utils
│       └── src/
├── examples/                # Placeholder for Task 6
├── .github/workflows/       # Placeholder for Task 7
├── .eslintrc.cjs
├── .prettierrc
├── .gitignore
├── package.json
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── vitest.config.ts
└── README.md
```

### 1.2 Root Configuration

**pnpm-workspace.yaml**
- Define packages: `packages/*`, `examples/*`

**package.json (root)**
- Scripts: `build`, `dev`, `test`, `lint`, `typecheck`, `clean`
- DevDependencies: typescript ^5.5, tsup ^8, vitest ^2, eslint ^9, prettier ^3

**tsconfig.base.json**
- Target: ES2022
- Module: ESNext
- Strict mode enabled
- Declaration files enabled

### 1.3 SDK Package (@x402-ups/sdk)

**package.json**
- Dependencies: `viem ^2.21`
- Exports: main entry + subpath exports for `/wallet`, `/account`, `/payment`
- ESM and CJS dual format

**tsup.config.ts**
- Entry points: `index.ts`, `wallet/index.ts`, `account/index.ts`, `payment/index.ts`
- Format: ESM + CJS
- DTS generation enabled
- Tree-shaking enabled

### 1.4 React Package (@x402-ups/react)

**package.json**
- Dependencies: `zustand ^4.5`
- PeerDependencies: `react ^18`, `@tanstack/react-query ^5`, `@x402-ups/sdk`

### 1.5 Linting & Formatting

**.eslintrc.cjs**
- TypeScript ESLint rules
- React hooks rules for .tsx files
- Prettier integration

**.prettierrc**
- Single quotes, trailing commas, 2-space indent

### 1.6 Testing Configuration

**vitest.config.ts**
- Global test setup
- Coverage with v8 provider
- Include patterns for test files

---

## Acceptance Criteria

- [ ] `pnpm install` completes without errors
- [ ] `pnpm build` completes (empty builds OK at this stage)
- [ ] `pnpm lint` runs without configuration errors
- [ ] `pnpm typecheck` runs without errors
- [ ] All three packages have correct exports configuration
- [ ] TypeScript strict mode enabled in all packages

## Verification Commands
```bash
pnpm install
pnpm build
pnpm lint
pnpm typecheck
```
