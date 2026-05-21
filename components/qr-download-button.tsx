"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface QrDownloadButtonProps {
  campaignId: string;
}

export function QrDownloadButton({ campaignId }: QrDownloadButtonProps) {
  return (
    <a
      href={`/api/qr?campaignId=${campaignId}`}
      download={`campaign-${campaignId}-qr.png`}
    >
      <Button
        size="sm"
        variant="outline"
        type="button"
        className="border-white/15 bg-white/5 backdrop-blur-md transition-colors hover:border-violet/40 hover:bg-white/10"
      >
        <Download className="size-3.5" />
        QR
      </Button>
    </a>
  );
}
