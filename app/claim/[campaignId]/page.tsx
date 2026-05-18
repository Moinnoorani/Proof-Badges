import { ClaimCard } from "@/components/claim-card";

export default function ClaimPage({ params }: { params: { campaignId: string } }) {
  return <ClaimCard campaignId={params.campaignId} />;
}
