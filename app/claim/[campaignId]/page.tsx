import { ClaimCard } from "@/components/claim-card";
import { NetworkGuard } from "@/components/network-guard";
import { ScrollParallaxContainer } from "@/components/scroll-parallax-container";

export default function ClaimPage({
  params,
}: {
  params: { campaignId: string };
}) {
  return (
    <NetworkGuard>
      <div className="relative min-h-screen px-4 py-10 md:py-14">
        <ScrollParallaxContainer className="mx-auto w-full max-w-3xl">
          <ClaimCard campaignId={params.campaignId} />
        </ScrollParallaxContainer>
      </div>
    </NetworkGuard>
  );
}

