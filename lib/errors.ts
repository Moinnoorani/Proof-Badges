export type UiError = { stage?: string; code: string; message: string };

const ERROR_MAP: [RegExp, string, string][] = [
  [/user rejected|User rejected|ACTION_REJECTED|user rejected transaction/i, "user_rejected", "Transaction was rejected"],
  [/execution reverted: NotStarted|NotStarted|0x6f312cbd/i, "not_started", "Campaign has not started yet"],
  [/execution reverted: Ended|Ended|0x477383f3/i, "ended", "Campaign has already ended"],
  [/execution reverted: SoldOut|SoldOut|0x52df9fe5/i, "sold_out", "All badges have been minted"],
  [/execution reverted: AlreadyClaimed|AlreadyClaimed|0x646cf558/i, "already_claimed", "You have already claimed this badge"],
  [/execution reverted: SoulboundTransfer|SoulboundTransfer|0x7a54ebfc/i, "soulbound_transfer", "Soulbound badges cannot be transferred"],
  [/execution reverted: InvalidWindow|InvalidWindow|0x392334ed/i, "invalid_window", "Invalid claim window"],
  [/execution reverted: InvalidSupply|InvalidSupply|0x15ae6727/i, "invalid_supply", "Invalid supply configuration"],
  [/insufficient funds|insufficient funds for gas|insufficient balance/i, "insufficient_funds", "Insufficient balance for gas"],
  [/network.*error|rpc.*error|network changed|network.*disconnect/i, "network_error", "Network error. Please check your connection"],
  [/timed out|timeout/i, "timeout", "Request timed out"],
  [/no wallet|wallet not found/i, "no_wallet", "No wallet detected"],
  [/campaign.*not.*found|not found|CampaignNotFound|0x6ff36e16/i, "not_found", "Campaign not found"],
  [/image.*invalid|invalid image|validation.*image/i, "invalid_image", "Invalid image"],
  [/failed to fetch|fetch.*fail/i, "fetch_error", "Failed to fetch data"],
];

export function mapErrorToUiMessage(error: unknown): UiError {
  const message =
    error instanceof Error ? error.message : String(error ?? "Unknown error");

  for (const [pattern, code, uiMessage] of ERROR_MAP) {
    if (pattern.test(message)) {
      return { code, message: uiMessage };
    }
  }

  if (message.length > 120) {
    return { code: "unknown", message: message.slice(0, 120) + "..." };
  }

  return { code: "unknown", message };
}
