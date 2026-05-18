"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { useAccount } from "wagmi";
import { useUgfCreateCampaign } from "@/hooks/use-ugf-create-campaign";
import { campaignSchema, type CampaignFormInput } from "@/lib/validate-campaign";
import { validateImageUpload } from "@/lib/validate-image";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { UgfPipelinePanel } from "@/components/ugf-pipeline-panel";
import { NetworkGuard } from "@/components/network-guard";

export function CampaignForm() {
  const router = useRouter();
  const { address } = useAccount();
  const { create, pipeline, campaignId } = useUgfCreateCampaign();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [metadataPosted, setMetadataPosted] = useState(false);

  const form = useForm({
    resolver: zodResolver(campaignSchema) as any,
    defaultValues: {
      name: "",
      description: "",
      imageUrl: "",
      maxSupply: 100,
      startTime: Math.floor(Date.now() / 1000),
      endTime: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
      soulbound: false,
    },
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageError(null);
    setImagePreview(null);

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    const sizeBytes = file.size;

    const buffer = await file.slice(0, 12).arrayBuffer();
    const magicBytes = new Uint8Array(buffer);

    const validation = validateImageUpload({ sizeBytes, declaredExtension: ext, magicBytes });
    if (!validation.valid) {
      setImageError(validation.reason);
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));

    setImageUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Upload failed");
      }

      const data = await res.json() as { url: string };
      form.setValue("imageUrl", data.url);
      toast.success("Image uploaded");
    } catch {
      setImageError("Failed to upload image. Please try again.");
    } finally {
      setImageUploading(false);
    }
  };

  const onSubmit = async (values: CampaignFormInput) => {
    if (submitting) return;
    setSubmitting(true);

    try {
      if (!values.imageUrl) {
        toast.error("Please upload an image first");
        setSubmitting(false);
        return;
      }

      create({
        maxSupply: values.maxSupply,
        startTime: values.startTime,
        endTime: values.endTime,
        soulbound: values.soulbound,
        baseURI: values.imageUrl,
      });
    } catch {
      toast.error("Failed to start campaign creation");
      setSubmitting(false);
    }
  };

  const handlePostMetadata = async (id: string) => {
    try {
      const values = form.getValues();
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          name: values.name,
          description: values.description,
          imageUrl: values.imageUrl,
          creator: address,
          maxSupply: values.maxSupply,
          startTime: values.startTime,
          endTime: values.endTime,
          soulbound: values.soulbound,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to save campaign metadata");
      }

      setMetadataPosted(true);
      toast.success("Campaign created!");
      router.push(`/creator?new=${id}`);
    } catch {
      toast.error("Failed to save campaign metadata. You can retry from the dashboard.");
    }
  };

  useEffect(() => {
    if (campaignId && submitting && !metadataPosted) {
      handlePostMetadata(campaignId.toString());
    }
  }, [campaignId, submitting, metadataPosted]);

  const pipelineActive = pipeline.quote === "active" ||
    pipeline.settle === "active" ||
    pipeline.execute === "active" ||
    pipeline.confirm === "active";

  const allStagesSuccess =
    pipeline.quote === "success" &&
    pipeline.settle === "success" &&
    pipeline.execute === "success" &&
    pipeline.confirm === "success";

  const isSubmitting = submitting && (pipelineActive || allStagesSuccess || !metadataPosted);

  return (
    <NetworkGuard>
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Create Campaign</CardTitle>
          <CardDescription>
            Set up a new gasless badge campaign
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="My Awesome Badge" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input placeholder="Describe your badge campaign" {...field} />
                    </FormControl>
                    <FormDescription>
                      Optional. Max 500 characters.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-2">
                <Label>Image</Label>
                <div
                  className="flex flex-col items-center gap-3 rounded-lg border-2 border-dashed p-6 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="max-h-32 rounded object-contain"
                    />
                  ) : (
                    <ImageIcon className="size-8 text-muted-foreground" />
                  )}
                  <p className="text-sm text-muted-foreground">
                    {imageUploading
                      ? "Uploading..."
                      : imageFile
                        ? imageFile.name
                        : "Click to select an image"}
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    className="hidden"
                    onChange={handleFileSelect}
                    disabled={imageUploading}
                  />
                </div>
                {imageError && (
                  <p className="text-sm font-medium text-destructive">{imageError}</p>
                )}
              </div>

              <FormField
                control={form.control}
                name="maxSupply"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Supply</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={10000}
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>
                      Maximum number of badges that can be minted (1–10,000).
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Time</FormLabel>
                      <FormControl>
                        <Input
                          type="datetime-local"
                          value={
                            field.value
                              ? new Date(field.value * 1000).toISOString().slice(0, 16)
                              : ""
                          }
                          onChange={(e) =>
                            field.onChange(Math.floor(new Date(e.target.value).getTime() / 1000))
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Time</FormLabel>
                      <FormControl>
                        <Input
                          type="datetime-local"
                          value={
                            field.value
                              ? new Date(field.value * 1000).toISOString().slice(0, 16)
                              : ""
                          }
                          onChange={(e) =>
                            field.onChange(Math.floor(new Date(e.target.value).getTime() / 1000))
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="soulbound"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center gap-2">
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          className="h-4 w-4 rounded border-border"
                        />
                      </FormControl>
                      <FormLabel className="mb-0">Soulbound (non-transferable)</FormLabel>
                    </div>
                    <FormDescription>
                      Soulbound badges cannot be transferred to other wallets.
                    </FormDescription>
                  </FormItem>
                )}
              />

              {submitting && (
                <div className="space-y-3 rounded-lg bg-muted p-4">
                  <p className="text-sm font-medium">Creating campaign...</p>
                  <UgfPipelinePanel pipeline={pipeline} />
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={submitting || !form.formState.isValid || imageUploading}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Campaign"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </NetworkGuard>
  );
}
