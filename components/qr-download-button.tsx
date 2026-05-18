"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface QrDownloadButtonProps {
  campaignId: string;
}

export function QrDownloadButton({ campaignId }: QrDownloadButtonProps) {
  return (
    <a href={`/api/qr?campaignId=${campaignId}`} download={`campaign-${campaignId}-qr.png`}>
      <Button size="sm" variant="outline" type="button">
        <Download className="size-3.5" />
        QR
      </Button>
    </a>
  );
}
