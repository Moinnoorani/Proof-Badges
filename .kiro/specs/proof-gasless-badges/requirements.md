# Requirements Document

## Introduction

Proof is a gasless POAP-style achievement badge dApp built on Base Sepolia. End users claim ERC-721 (or soulbound ERC-721) badges by opening a shareable link or scanning a QR code, without ever holding ETH. Gas fees are settled in Mock USD via the Universal Gas Framework (UGF) Testnet SDK using its quote → settle → execute → confirm pipeline. Creators can launch campaigns (image, supply, claim window). The dApp is optimized for hackathon judging: a visible UGF Pipeline panel makes the "no ETH needed" moment obvious during demo.

The core differentiator versus existing POAP-style apps is that users go from "I have a wallet with 0 ETH" to "I own a badge NFT" in a single click, with every step of the UGF flow rendered live so judges can see the gas barrier being removed in real time.

**Future work (out of scope for v1):** An optional AI agent that auto-claims Badges on a user's behalf via UGF, watching for new Campaigns matching user-defined criteria. This is intentionally excluded from acceptance criteria to keep the v1 demo surface tight and risk-free.

## Glossary

- **UGF**: Universal Gas Framework. Testnet protocol that lets users pay gas in an ERC-20 (Mock USD) instead of native ETH. Flow: `quote → settle → execute → confirm`.
- **Mock_USD**: ERC-20 test token used to pay UGF gas fees. Distributed by the UGF faucet.
- **UGF_SDK**: `@tychilabs/react-ugf` (React hooks/components) wrapping `@tychilabs/ugf-testnet-js`.
- **UGF_Pipeline**: The four-stage transaction lifecycle (quote, settle, execute, confirm) rendered as a visible UI panel during every gasless transaction.
- **Badge**: An on-chain achievement, minted as an ERC-721 token from a single Badge_Contract on Base Sepolia. Each badge belongs to exactly one Campaign.
- **Soulbound_Badge**: A Badge whose `transferFrom` and `safeTransferFrom` always revert. Non-transferable.
- **Campaign**: A creator-defined badge type with metadata (name, description, image), a max supply, and a claim window (`start_time`, `end_time`). Identified by a `campaign_id`.
- **Claim_Link**: A URL of the form `/claim/{campaign_id}` (optionally with a `code` query param) that lets a wallet claim one badge from a Campaign. Renderable as a QR code.
- **Creator**: A wallet that creates Campaigns via the Creator_Dashboard.
- **Claimer**: A wallet that claims a Badge via a Claim_Link.
- **Badge_Contract**: The single ERC-721 contract on Base Sepolia that mints all Badges across all Campaigns.
- **Frontend**: The Next.js 14 App Router web application.
- **Wallet_Connector**: The wagmi + viem wallet connection layer used by the Frontend.
- **Faucet_Service**: The UGF-hosted faucet at `https://universalgasframework.com/faucets` that issues Mock_USD to a wallet.
- **Base_Sepolia**: The target EVM chain (chain id 84532) for all on-chain reads and writes.
- **Metadata_Store**: A hosted Postgres database (Vercel Postgres, Neon, or Supabase) that holds Campaign records keyed by `campaign_id`. Images are uploaded to a blob store (Vercel Blob, or IPFS via web3.storage / NFT.Storage) and referenced by URL from the database row.
- **Discovery_View**: The public `/` (home) view listing recent and active Campaigns, with a search box. No wallet connection required to browse.

## Requirements

### Requirement 1: Gasless Badge Claim via UGF

**User Story:** As a Claimer with zero ETH, I want to claim a Badge from a Claim_Link by paying gas in Mock_USD, so that I can own an on-chain achievement without first acquiring ETH.

#### Acceptance Criteria

1. WHEN a Claimer opens a Claim_Link for an active Campaign, THE Frontend SHALL display the Campaign metadata (name, description, image, supply remaining, claim window) and a single "Claim Badge" call-to-action.
2. WHEN a Claimer clicks "Claim Badge" with a connected wallet, THE Frontend SHALL initiate a UGF gasless transaction that mints one Badge of the Campaign to the connected wallet, with gas paid in Mock_USD.
3. WHEN a UGF gasless claim is initiated, THE Frontend SHALL submit the transaction through the UGF_SDK using the quote → settle → execute → confirm pipeline and SHALL NOT require the Claimer to hold ETH.
4. WHEN the UGF pipeline reaches the `confirm` stage successfully, THE Frontend SHALL display the minted Badge (image, token id, transaction hash linked to BaseScan) within 3 seconds of confirmation.
5. IF the connected wallet has insufficient Mock_USD to cover the UGF quote, THEN THE Frontend SHALL block the claim and surface the "Get Mock USD" faucet action with the shortfall amount.
6. IF the Campaign is outside its claim window or fully minted, THEN THE Frontend SHALL disable the "Claim Badge" call-to-action and display the reason (`not_started`, `ended`, or `sold_out`).
7. IF the connected wallet has already claimed a Badge from the Campaign, THEN THE Frontend SHALL disable the "Claim Badge" call-to-action and display "Already claimed".

### Requirement 2: Live UGF Pipeline Visualization

**User Story:** As a hackathon judge or first-time user, I want to see each UGF stage update live during a claim, so that I can visibly confirm gas is being paid in Mock_USD instead of ETH.

#### Acceptance Criteria

1. WHEN a UGF gasless transaction is in progress, THE Frontend SHALL render a UGF_Pipeline panel showing the four stages `quote`, `settle`, `execute`, `confirm` with per-stage status (`pending`, `active`, `success`, `failed`).
2. WHEN the UGF_SDK emits a stage transition, THE Frontend SHALL update the corresponding stage indicator within 500ms of the SDK event.
3. WHEN the `quote` stage completes, THE Frontend SHALL display the quoted gas cost in Mock_USD and the estimated equivalent ETH-saved value returned by the UGF_SDK.
4. WHEN the `execute` stage completes, THE Frontend SHALL display the resulting Base_Sepolia transaction hash with a link to BaseScan.
5. IF any stage emits a failure, THEN THE Frontend SHALL mark that stage `failed`, halt subsequent stages, and display the SDK-provided error message with a "Retry" action.

### Requirement 3: Mock USD Faucet Integration

**User Story:** As a Claimer with a fresh wallet, I want a one-click way to top up Mock_USD, so that I can pay UGF gas without leaving the dApp to figure out the faucet.

#### Acceptance Criteria

1. THE Frontend SHALL display the connected wallet's Mock_USD balance in the header at all times when a wallet is connected.
2. WHEN a Claimer clicks the "Get Mock USD" button, THE Frontend SHALL open the Faucet_Service URL (`https://universalgasframework.com/faucets`) prefilled with the connected wallet address where supported, in a new browser tab.
3. WHEN the Frontend detects a Mock_USD balance increase after the faucet action, THE Frontend SHALL refresh the balance display within 5 seconds and re-enable any blocked claim actions.
4. WHILE the Mock_USD balance is less than or equal to the most recent UGF quote, THE Frontend SHALL keep the "Get Mock USD" button visually prominent on the active claim view.

### Requirement 4: Wallet Connection and Network Enforcement

**User Story:** As a Claimer, I want the dApp to connect my wallet and switch me to Base Sepolia automatically, so that I do not need to know about chain IDs to claim a badge.

#### Acceptance Criteria

1. WHEN a Claimer clicks "Connect Wallet" on any view, THE Wallet_Connector SHALL present supported wallet options (injected, WalletConnect) and complete connection on user approval.
2. WHEN a wallet connects on a chain other than Base_Sepolia, THE Frontend SHALL request a chain switch to Base_Sepolia (chain id 84532) via the wallet provider.
3. IF the wallet rejects the chain switch or does not have Base_Sepolia configured, THEN THE Frontend SHALL display a "Add Base Sepolia" action that injects the network parameters into the wallet provider.
4. WHILE the connected wallet is on a chain other than Base_Sepolia, THE Frontend SHALL disable all claim and creator actions and SHALL display a network mismatch banner.
5. WHEN a Claimer disconnects their wallet, THE Frontend SHALL clear all wallet-derived state (balance, eligibility, owned badges) from the active session.

### Requirement 5: Campaign Creation by Creators

**User Story:** As a Creator, I want to launch a badge Campaign from a dashboard, so that I can distribute achievements to my community without writing contract code.

#### Acceptance Criteria

1. WHEN a Creator submits a Campaign creation form with name, description, image, max supply (>=1), start_time, end_time, and `soulbound` flag, THE Frontend SHALL validate all fields and initiate a UGF gasless transaction that registers the Campaign on the Badge_Contract.
2. IF `end_time` is not strictly after `start_time`, THEN THE Frontend SHALL reject the submission with a validation error and SHALL NOT initiate any transaction.
3. IF max supply is less than 1 or greater than 10000, THEN THE Frontend SHALL reject the submission with a validation error.
4. WHEN a Campaign creation transaction is confirmed by the UGF pipeline, THE Frontend SHALL display the new Campaign's `campaign_id`, its Claim_Link, and a downloadable QR code encoding the Claim_Link.
5. THE Creator_Dashboard SHALL list all Campaigns created by the connected wallet with current minted count, supply remaining, claim window status, and a copy-to-clipboard Claim_Link button.
6. IF Campaign image upload exceeds 2MB, has an unsupported file extension (other than `png`, `jpg`, `jpeg`, `webp`, `gif`), or has file contents whose magic bytes do not match the declared extension, THEN THE Frontend SHALL reject the upload with a validation error.

### Requirement 6: Soulbound Badge Enforcement

**User Story:** As a Creator, I want the option to make a Campaign's Badges non-transferable, so that achievements stay tied to the wallet that earned them.

#### Acceptance Criteria

1. WHERE a Campaign's `soulbound` flag is true, THE Badge_Contract SHALL revert any `transferFrom` or `safeTransferFrom` call for tokens belonging to that Campaign, except for minting (transfer from the zero address).
2. WHERE a Campaign's `soulbound` flag is false, THE Badge_Contract SHALL allow standard ERC-721 transfers.
3. WHEN displaying a Badge owned by a Claimer, THE Frontend SHALL render a "Soulbound" indicator if the Badge belongs to a soulbound Campaign.

### Requirement 7: Badge Gallery and Profile

**User Story:** As a Claimer, I want to view all Badges I have collected, so that I can show off my on-chain achievements.

#### Acceptance Criteria

1. WHEN a Claimer opens the `/me` profile view with a connected wallet that owns zero Badges, THE Frontend SHALL render only the empty state described in 7.4 and SHALL NOT render an empty badge grid.
2. WHEN a Claimer opens the `/me` profile view with a connected wallet that owns one or more Badges, THE Frontend SHALL display all Badges owned by that wallet, grouped by Campaign, including image, name, mint timestamp, and token id.
3. WHEN a Claimer opens `/profile/{address}` with a valid EVM address, THE Frontend SHALL display the public Badge collection for that address without requiring a wallet connection, applying the same zero-Badges empty state rule from 7.1.
4. THE Frontend SHALL provide a "Share" action on the profile view that copies a public profile URL to the clipboard.
5. WHEN a profile view has zero Badges to display, THE Frontend SHALL display an empty state with a "Find a Campaign" call-to-action linking to the Campaign discovery view.

### Requirement 8: Claim Link and QR Code Distribution

**User Story:** As a Creator, I want shareable Claim_Links and QR codes for each Campaign, so that I can distribute claims via social, email, or in-person events.

#### Acceptance Criteria

1. THE Frontend SHALL generate a Claim_Link of the form `/claim/{campaign_id}` for every Campaign.
2. WHEN a Creator clicks "Download QR" on a Campaign, THE Frontend SHALL generate a PNG QR code encoding the absolute Claim_Link URL and trigger a browser download.
3. WHEN a Claim_Link is opened on a mobile browser without an injected wallet AND the `campaign_id` exists, THE Frontend SHALL offer a WalletConnect deep-link path to complete the claim.
4. WHEN a Claim_Link is opened for a `campaign_id` that does not exist, THE Frontend SHALL display a "Campaign not found" empty state, taking precedence over any wallet-connection prompts.

### Requirement 9: Zero-ETH Onboarding Flow

**User Story:** As a first-time Claimer with no ETH, I want a guided onboarding when I open a Claim_Link, so that I can go from zero to claimed badge in under one minute.

#### Acceptance Criteria

1. WHEN a Claimer opens a Claim_Link without a connected wallet, THE Frontend SHALL display an onboarding flow with three ordered steps: "Connect Wallet", "Get Mock USD", "Claim Badge".
2. WHEN the Claimer completes a step, THE Frontend SHALL mark that step complete and advance focus to the next incomplete step.
3. WHILE step 2 ("Get Mock USD") has not been explicitly marked complete by the Claimer, THE Frontend SHALL keep step 3 disabled, even if a non-zero Mock_USD balance has been detected.
4. WHEN all three steps are complete and the badge is minted, THE Frontend SHALL display a celebratory state with "Share" and "View My Badges" actions.

### Requirement 10: Error Handling and Retry

**User Story:** As a Claimer, I want clear errors and a one-click retry when a UGF transaction fails, so that transient testnet issues don't block my claim.

#### Acceptance Criteria

1. IF the UGF_SDK returns a network or RPC error during any pipeline stage, THEN THE Frontend SHALL display the stage, the error code, and a "Retry" action that re-runs the failed stage onward.
2. IF the user rejects a wallet signature prompt, THEN THE Frontend SHALL cancel the UGF pipeline, mark the active stage `failed` with reason `user_rejected`, and return the UI to the pre-claim state.
3. IF a claim transaction reverts on-chain (for example, supply exhausted between quote and execute), THEN THE Frontend SHALL display the revert reason from the transaction receipt and SHALL refresh Campaign supply state.
4. WHEN the UGF_SDK is unreachable for more than 10 seconds during the `quote` stage, THE Frontend SHALL time out the request and display a "UGF service unavailable, retry" message.

### Requirement 11: Campaign Metadata Storage

**User Story:** As a Creator, I want my Campaign's name, description, image, supply, and window to persist reliably, so that Claimers see correct information whenever they open a Claim_Link.

#### Acceptance Criteria

1. WHEN a Campaign is created, THE Frontend SHALL persist the Campaign's `campaign_id`, name, description, image URL, max supply, start_time, end_time, soulbound flag, and creator wallet address to the Metadata_Store.
2. WHEN a Campaign image is uploaded, THE Frontend SHALL store the image in the configured blob store (Vercel Blob or IPFS via web3.storage / NFT.Storage) and SHALL persist only the resulting URL in the Metadata_Store.
3. WHEN the Frontend renders a Claim_Link or Discovery_View, THE Frontend SHALL read Campaign records from the Metadata_Store and SHALL read live supply and ownership state from the Badge_Contract on Base_Sepolia.
4. IF the Metadata_Store record for a `campaign_id` is missing or unreachable, THEN THE Frontend SHALL display a "Campaign metadata unavailable" empty state and SHALL NOT permit a claim attempt.
5. THE Badge_Contract SHALL store, for each `campaign_id`, the on-chain enforcement fields required for claiming: max supply, minted count, start_time, end_time, soulbound flag, and creator address.

### Requirement 12: Campaign Discovery View

**User Story:** As a Claimer browsing without a Claim_Link, I want a public home page where I can find active Campaigns, so that I can discover and claim Badges directly from the dApp.

#### Acceptance Criteria

1. WHEN a visitor opens the `/` (home) view, THE Frontend SHALL display the Discovery_View with a list of Campaigns ordered by most recently created first.
2. THE Discovery_View SHALL render each Campaign card with image, name, creator address (truncated), supply remaining, claim window status (`upcoming`, `active`, `ended`, `sold_out`), and a Claim_Link button.
3. WHEN a visitor enters a query in the Discovery_View search box, THE Frontend SHALL filter the listed Campaigns by case-insensitive substring match against Campaign name and creator address.
4. WHEN a visitor opens the `/` view without a connected wallet, THE Discovery_View SHALL render fully and SHALL NOT require a wallet connection.
5. WHEN a Claimer follows the "Find a Campaign" CTA from an empty profile view, THE Frontend SHALL navigate to the Discovery_View.
