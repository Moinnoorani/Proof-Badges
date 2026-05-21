# Proof — On-Chain Badges

Proof is a decentralized application that allows creators to mint and users to claim POAP-style achievement badges on the Base Sepolia testnet.

## Features

*   **Create Campaigns:** Creators can define custom badge campaigns with a specific max supply, time window, and an image. They can also choose to make badges soulbound (non-transferable).
*   **Claim Badges:** Users can connect their wallet to claim badges from active campaigns.
*   **My Badges:** View a gallery of all the badges you've collected.
*   **Creator Dashboard:** Creators can track their campaigns and see how many badges have been claimed.

## Tech Stack

*   **Frontend:** Next.js (App Router), React, Tailwind CSS, shadcn/ui
*   **Web3:** Wagmi, viem, WalletConnect
*   **Smart Contracts:** Solidity, Foundry/Hardhat (ERC721Enumerable)
*   **Database:** Neon (PostgreSQL), Drizzle ORM
*   **Storage:** Vercel Blob (or local storage fallback for images)

## Getting Started

### Prerequisites

*   Node.js (v18+)
*   npm or yarn
*   A WalletConnect Project ID
*   Base Sepolia ETH (for deploying the contract and claiming badges)

### Environment Variables

Create a `.env.local` file in the root directory and add the following variables:

```env
DATABASE_URL=your_neon_postgres_url
BLOB_READ_WRITE_TOKEN=your_vercel_blob_token (or leave as placeholder_token for local upload)
NEXT_PUBLIC_BADGE_CONTRACT=deployed_contract_address
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
NEXT_PUBLIC_BASE_SEPOLIA_RPC=https://sepolia.base.org
```

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/Moinnoorani/Proof-Badges.git
    cd Proof-Badges
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Run database migrations (if applicable using Drizzle):
    ```bash
    npm run db:push
    ```

4.  Deploy the Smart Contract:
    ```bash
    node scripts/deploy-contract.mjs YOUR_PRIVATE_KEY
    ```
    This script will deploy the `BadgeContract` to Base Sepolia and automatically update your `.env.local` file with the deployed contract address.

5.  Start the development server:
    ```bash
    npm run dev
    ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Smart Contract

The core smart contract `BadgeContract.sol` is an ERC721 token that implements campaign-specific logic. It allows creators to start a campaign and users to claim a token ID associated with that campaign, storing the mapping on-chain.

## License

MIT
