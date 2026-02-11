# Smart Accounts (EIP-4337)

The UPS SDK exclusively uses Smart Accounts (verified against EIP-4337 standards) instead of traditional Externally Owned Accounts (EOAs) for all transactions. This enables advanced features like gas abstraction, session keys (future), and recovery.

## FAQ

### What is a Smart Account vs. EOA?
- **EOA (Externally Owned Account)**: A traditional wallet (like MetaMask default) controlled by a private key. It initiates transactions and pays gas directly.
- **Smart Account**: A smart contract wallet. It *is* code. It needs an "owner" (your EOA) to sign instructions, but the Smart Account itself executes the transaction. This separates "signing" from "execution".

### How does Counterfactual Deployment work?
You can receive funds to a Smart Account address *before* it is deployed to the blockchain.
1.  **Predict**: The SDK uses `client.account.predictAddress()` to calculate where the contract *will* be deployed based on your owner address and a salt.
2.  **Fund**: You can send tokens to this address immediately.
3.  **Deploy**: The account is only deployed (and gas paid) when the first outgoing transaction occurs or when you explicitly call `create`.

### Account Recovery
Since the Smart Account is a contract, it can support recovery mechanisms if you lose your private key (Owner EOA).
*Note: The current UPS SDK implementation delegates recovery logic to the underlying factory configuration. Please contact support if you need to rotate ownership of a deployed account.*
