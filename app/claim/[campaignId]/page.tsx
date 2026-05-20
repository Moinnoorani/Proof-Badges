import { ClaimCard } from "@/components/claim-card";
import { NetworkGuard } from "@/components/network-guard";

export default function ClaimPage({ params }: { params: { campaignId: string } }) {
  return (
    <NetworkGuard>
      <ClaimCard campaignId={params.campaignId} />
    </NetworkGuard>
  );
}
