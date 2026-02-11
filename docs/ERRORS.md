# Error Handling

The UPS SDK uses a typed error system. All errors thrown by the SDK extend the base `UPSError` class.

## Error Registry

| Error Class | Code | Description |
| :--- | :--- | :--- |
| `UPSError` | `UPS_ERROR` | Base class for all SDK errors. |
| `NetworkError` | `NETWORK_ERROR` | HTTP transport failures, timeouts, or non-200 responses. Check `.status` for HTTP status code. |
| `AuthError` | `AUTH_ERROR` | Authentication failed. Signatures may be invalid, or the auth token expired. |
| `WalletError` | `WALLET_ERROR` | Wallet interaction failed. Common if user rejects the signature request or the provider is disconnected. |
| `PaymentError` | `PAYMENT_ERROR` | Payment logic failure. e.g., "Insufficient funds", "Verification failed", or "Slippage exceeded". |
| `RateLimitError` | `RATE_LIMIT_ERROR` | Too many requests. Retry after a backoff period. |

## Troubleshooting Common Issues

### `WalletError: User rejected connection`
- **Cause**: The user clicked "Reject" in their wallet popup (e.g., MetaMask).
- **Fix**: Prompt the user again explaining why the connection is needed.

### `PaymentError: Payment verification failed`
- **Cause**: The UPS Backend rejected the signature or requirements details *before* sending to chain.
- **Fix**:
  - Ensure the `amount` is within the user's balance.
  - Check if the `validBefore` timestamp is too short (default is 1 hour).
  - Verify the `network` matches the UPS Backend environment.

### `NetworkError` followed by `502 Bad Gateway`
- **Cause**: The UPS Backend might be down or under maintenance.
- **Fix**: Implement a retry strategy with exponential backoff.
