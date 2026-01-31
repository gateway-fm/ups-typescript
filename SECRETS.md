# Required GitHub Secrets and Configuration

## Secrets

To ensure the CI/CD pipelines function correctly, the following secrets must be added to the GitHub repository settings:

| Secret | Description | Required By |
|--------|-------------|-------------|
| `NPM_TOKEN` | npm automation token for publishing packages to the npm registry. | `release.yml` |
| `CODECOV_TOKEN` | Token for uploading coverage reports to Codecov. | `ci.yml` |
| `API_BASE_URL` | Base URL of the backend API for E2E tests. | `ci.yml` (E2E job) |
| `BLOCKCHAIN_RPC_URL` | RPC URL for the blockchain network used in E2E tests. | `ci.yml` (E2E job) |
| `BLOCKCHAIN_CHAIN_ID` | Chain ID of the blockchain network. | `ci.yml` (E2E job) |
| `BLOCKCHAIN_PAYMENT_TOKEN_ADDRESS` | Address of the payment token used in E2E tests. | `ci.yml` (E2E job) |
| `TEST_PRIVATE_KEY` | Private key for the wallet used in E2E tests. Ensure this wallet has funds. | `ci.yml` (E2E job) |

## Branch Protection Rules

The following branch protection rules should be manually configured for the `main` branch:

1.  **Require a pull request before merging**
    *   Require approvals (at least 1)
2.  **Require status checks to pass before merging**
    *   `lint`
    *   `build`
    *   `test`
3.  **Require branches to be up to date before merging**
4.  **Do not allow bypassing the above settings**

## Repository Settings

*   Ensure that "Read and write permissions" are enabled for "Workflow permissions" under `Settings > Actions > General` to allow the release workflow to create GitHub Releases.
