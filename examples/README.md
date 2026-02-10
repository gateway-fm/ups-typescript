# UPS SDK Examples

This directory contains examples demonstrating how to use the UPS SDK in various environments and use cases.

## Available Examples

| Example | Type | Description | Key Features |
| :--- | :--- | :--- | :--- |
| **1. [Basic Node.js](./basic)** | Backend / Script | Minimal TypeScript example for Node.js. | • Account Creation<br>• Admin Funding<br>• Direct Payments |
| **2. [React App](./react-app)** | Frontend (Vite) | Generic React application using hooks. | • Wallet Connection<br>• Auth & Account Mgmt<br>• General Payments |
| **3. [Invoice App](./react-invoice-app)** | Frontend (Vite) | Specialized app for invoice management. | • Invoice Creation<br>• Invoice Payment Flow<br>• List/Cancel Invoices |
| **4. [Escrow App](./react-escrow-app)** | Frontend (Vite) | Specialized app for escrow payments. | • Escrow Creation<br>• Release/Refund Flows<br>• Arbiter Interaction |

---

## 1. Basic Example (Node.js)
**Path:** [`./basic`](./basic)

A script-based example ideally suited for understanding the core SDK flows without UI distractions. It simulates a complete interaction between a Buyer and a Merchant.

- **Run:** `pnpm start` inside the directory.
- **Learn:** How to initialize `UPSClient`, create smart accounts programmatically, and execute payments using a funded admin key.

## 2. React Example
**Path:** [`./react-app`](./react-app)

A baseline React application demonstrating the `@gatewayfm/ups-react` hooks.

- **Run:** `pnpm dev`
- **Features:**
    - Connect with MetaMask (via `viem`).
    - Authenticate and create Smart Accounts.
    - Execute generic payments to any destination.

## 3. Invoice Management App
**Path:** [`./react-invoice-app`](./react-invoice-app)

Demonstrates the **Invoice Module** capabilities. This app focuses on a B2B use case where payments are linked to specific invoices.

- **Run:** `pnpm dev`
- **Key Hooks:** `useInvoice`, `usePayInvoice`.
- **Flow:** Create an invoice -> Payer views invoice -> Payer executes payment (metadata automatically handled).

## 4. Escrow Payment App
**Path:** [`./react-escrow-app`](./react-escrow-app)

Demonstrates the **Escrow Protocols** supported by the UPS SDK.

- **Run:** `pnpm dev`
- **Use Case:** Secure payments where funds are held until conditions are met (e.g., item delivery).
- **Features:**
    - Create conditional payment authorizations.
    - Interactions for Payers, Payees, and Arbiters.

---

## Getting Started

### Prerequisites
- **Node.js**: >= 18
- **Package Manager**: `pnpm` (required)
- **Browser Wallet**: MetaMask (for React examples)

### Setup Instructions

1.  **Install Dependencies** (Root)
    ```bash
    pnpm install
    ```

2.  **Build SDK Packages**
    It is recommended to build the local SDK packages first to ensure latest changes are picked up.
    ```bash
    pnpm build
    ```

3.  **Run an Example**
    Navigate to the specific example directory and follow its README.
    ```bash
    cd examples/react-app
    cp .env.example .env
    pnpm dev
    ```
