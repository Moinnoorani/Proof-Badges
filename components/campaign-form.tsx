"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Loader2,
  ImagePlus,
  Sparkles,
  Lock,
  CalendarRange,
  Hash,
  Type,
  AlignLeft,
} from "lucide-react";
import { toast } from "sonner";
import { useAccount } from "wagmi";
import { useUgfCreateCampaign } from "@/hooks/use-ugf-create-campaign";
import { campaignSchema, type CampaignFormInput } from "@/lib/validate-campaign";
import { validateImageUpload } from "@/lib/validate-image";
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
import { cn } from "@/lib/utils";

export function CampaignForm() {
  const router = useRouter();
  const { address } = useAccount();
  const { create, pipeline, campaignId, campaignIdError } = useUgfCreateCampaign();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [metadataPosted, setMetadataPosted] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const form = useForm<CampaignFormInput>({
    resolver: zodResolver(campaignSchema),
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
          campaignId: id,
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
      // Reset flags so the user can attempt re-submission if they stay on the page.
      setMetadataPosted(false);
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    form.reset();
    setImageFile(null);
    setImagePreview(null);
    setImageError(null);
    setSubmitting(false);
    setMetadataPosted(false);
  };

  useEffect(() => {
    if (campaignId && submitting && !metadataPosted) {
      handlePostMetadata(campaignId.toString());
    }
  }, [campaignId, submitting, metadataPosted]);

  useEffect(() => {
    if (campaignIdError && submitting) {
      toast.error(campaignIdError);
      setSubmitting(false);
    }
  }, [campaignIdError, submitting]);

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

  if (!mounted) return null;

  return (
    <NetworkGuard>
      <div className="gradient-border glass-strong relative w-full max-w-3xl overflow-hidden rounded-2xl">
        <div className="relative space-y-1 px-6 pt-6 sm:px-8 sm:pt-8">
          <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
            <Sparkles className="size-3 text-violet" />
            Campaign details
          </div>
          <h2 className="font-heading text-2xl font-semibold tracking-tight">
            <span className="text-gradient">Create</span>{" "}
            <span className="text-foreground/90">a new campaign</span>
          </h2>
          <p className="text-sm text-muted-foreground">
            Set up a gasless badge campaign on Base Sepolia.
          </p>
        </div>

        <div className="relative px-6 pt-6 pb-6 sm:px-8 sm:pb-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      <Type className="size-3 text-violet" />
                      Name
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="My Awesome Badge"
                        className="h-11 rounded-xl border-white/10 bg-white/[0.04] text-base backdrop-blur-md placeholder:text-muted-foreground/60 focus-visible:border-violet/40 focus-visible:ring-violet/30 md:text-base"
                        {...field}
                      />
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
                    <FormLabel className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      <AlignLeft className="size-3 text-cyan" />
                      Description
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Describe your badge campaign"
                        className="h-11 rounded-xl border-white/10 bg-white/[0.04] text-base backdrop-blur-md placeholder:text-muted-foreground/60 focus-visible:border-cyan/40 focus-visible:ring-cyan/30 md:text-base"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription className="text-xs text-muted-foreground/80">
                      Optional. Max 500 characters.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Image dropzone */}
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  <ImagePlus className="size-3 text-pink" />
                  Image
                </Label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    "group/drop relative flex min-h-[200px] cursor-pointer flex-col items-center justify-center gap-3 overflow-hidden rounded-2xl p-6 text-center transition-all",
                    "gradient-border glass",
                    "hover:shadow-[0_18px_60px_-20px_hsla(252_95%_70%/0.55)]",
                  )}
                >
                  {/* animated dashed border layer */}
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 rounded-2xl border border-dashed border-white/10 transition-colors duration-300 group-hover/drop:border-violet/40"
                  />
                  {/* hover glow */}
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover/drop:opacity-100"
                    style={{
                      background:
                        "radial-gradient(closest-side, hsla(252 95% 70% / 0.18), transparent 70%)",
                    }}
                  />

                  {imagePreview ? (
                    <div className="relative size-32 overflow-hidden rounded-xl ring-1 ring-white/10">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="size-full object-cover"
                      />
                      <div
                        aria-hidden
                        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent"
                      />
                    </div>
                  ) : (
                    <div className="relative">
                      <div
                        aria-hidden
                        className="absolute inset-0 -m-3 animate-glow-pulse rounded-full opacity-60"
                        style={{
                          background:
                            "radial-gradient(closest-side, hsla(252 95% 70% / 0.45), transparent 70%)",
                        }}
                      />
                      <div className="glass-strong relative flex size-14 items-center justify-center rounded-full ring-1 ring-violet/30">
                        <ImagePlus
                          className="size-6 text-violet drop-shadow-[0_2px_12px_hsla(252,95%,70%,0.6)]"
                          strokeWidth={1.75}
                        />
                      </div>
                    </div>
                  )}

                  <p className="relative text-sm text-muted-foreground">
                    {imageUploading ? (
                      <span className="inline-flex items-center gap-2 text-violet">
                        <Loader2 className="size-3.5 animate-spin" />
                        Uploading…
                      </span>
                    ) : imageFile ? (
                      <span className="font-mono text-foreground/90">
                        {imageFile.name}
                      </span>
                    ) : (
                      <>
                        <span className="text-foreground/90">
                          Drop or click
                        </span>{" "}
                        to upload an image
                      </>
                    )}
                  </p>
                  <p className="relative text-[10px] uppercase tracking-[0.18em] text-muted-foreground/70">
                    PNG · JPEG · WEBP · GIF
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
                  <p className="text-sm font-medium text-pink">
                    {imageError}
                  </p>
                )}
              </div>

              <FormField
                control={form.control}
                name="maxSupply"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      <Hash className="size-3 text-indigo" />
                      Max Supply
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={10000}
                        className="h-11 rounded-xl border-white/10 bg-white/[0.04] font-mono text-base backdrop-blur-md focus-visible:border-violet/40 focus-visible:ring-violet/30 md:text-base"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription className="text-xs text-muted-foreground/80">
                      Maximum number of badges that can be minted (1–10,000).
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                        <CalendarRange className="size-3 text-cyan" />
                        Start Time
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="datetime-local"
                          className="h-11 rounded-xl border-white/10 bg-white/[0.04] font-mono text-sm backdrop-blur-md focus-visible:border-cyan/40 focus-visible:ring-cyan/30"
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
                      <FormLabel className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                        <CalendarRange className="size-3 text-pink" />
                        End Time
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="datetime-local"
                          className="h-11 rounded-xl border-white/10 bg-white/[0.04] font-mono text-sm backdrop-blur-md focus-visible:border-pink/40 focus-visible:ring-pink/30"
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
                    <label
                      className={cn(
                        "group/sb relative flex cursor-pointer items-start gap-3 overflow-hidden rounded-xl p-4 transition-all",
                        "gradient-border glass",
                        field.value &&
                          "shadow-[0_0_30px_-8px_hsla(252_95%_70%/0.55)]",
                      )}
                    >
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          className="peer sr-only"
                        />
                      </FormControl>

                      {/* Custom checkbox visual */}
                      <span
                        aria-hidden
                        className={cn(
                          "relative mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border transition-all",
                          field.value
                            ? "border-transparent bg-gradient-to-br from-violet via-indigo to-cyan shadow-[0_0_18px_hsla(252_95%_70%/0.55)]"
                            : "border-white/20 bg-white/5",
                        )}
                      >
                        {field.value && (
                          <Lock
                            className="size-3 text-white"
                            strokeWidth={3}
                          />
                        )}
                      </span>

                      <span className="flex flex-1 flex-col gap-1">
                        <FormLabel className="mb-0 cursor-pointer text-sm font-medium">
                          Soulbound (non-transferable)
                        </FormLabel>
                        <FormDescription className="text-xs text-muted-foreground/80">
                          Soulbound badges cannot be transferred to other
                          wallets.
                        </FormDescription>
                      </span>
                    </label>
                  </FormItem>
                )}
              />

              {submitting && (
                <div className="space-y-3">
                  <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Pipeline
                  </div>
                  <UgfPipelinePanel pipeline={pipeline} />
                </div>
              )}

              <Button
                type="submit"
                size="lg"
                disabled={submitting || !form.formState.isValid || imageUploading}
                className={cn(
                  "shimmer relative h-12 w-full overflow-hidden rounded-xl text-base font-semibold tracking-tight text-white",
                  "bg-gradient-to-r from-violet via-indigo to-cyan",
                  "shadow-[0_8px_30px_-6px_hsla(252_95%_70%/0.6)] hover:opacity-95",
                  "disabled:cursor-not-allowed disabled:opacity-40",
                )}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Creating…
                  </>
                ) : (
                  <>
                    <Sparkles className="size-4" />
                    Create Campaign
                  </>
                )}
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </NetworkGuard>
  );
}
