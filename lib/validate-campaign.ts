import { z } from "zod";

/**
 * Shared zod schema for campaign form validation.
 * Used on both client and server to validate campaign creation inputs.
 *
 * Validates: Requirements 5.1, 5.2, 5.3
 */
export const campaignSchema = z
  .object({
    name: z
      .string()
      .min(1, "Name is required")
      .max(80, "Name must be 80 characters or fewer"),
    description: z
      .string()
      .max(500, "Description must be 500 characters or fewer"),
    imageUrl: z.string().min(1, "Image is required"),
    maxSupply: z
      .number()
      .int("Max supply must be a whole number")
      .min(1, "Max supply must be at least 1")
      .max(10000, "Max supply must be 10,000 or fewer"),
    startTime: z.number().int(),
    endTime: z.number().int(),
    soulbound: z.boolean({ required_error: "Soulbound must be a boolean" }),
  })
  .refine((data) => data.endTime > data.startTime, {
    message: "End time must be after start time",
    path: ["endTime"],
  });

export type CampaignFormInput = z.infer<typeof campaignSchema>;

/**
 * Validates a campaign form input and returns a structured result.
 *
 * @returns `{valid: true}` if all fields pass validation, or
 *          `{valid: false, errors: Record<string, string>}` with field-level error messages.
 */
export function validateCampaignForm(
  input: unknown
): { valid: true } | { valid: false; errors: Record<string, string> } {
  const result = campaignSchema.safeParse(input);

  if (result.success) {
    return { valid: true };
  }

  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const field = issue.path.join(".");
    // Only keep the first error per field
    if (!errors[field]) {
      errors[field] = issue.message;
    }
  }

  return { valid: false, errors };
}
