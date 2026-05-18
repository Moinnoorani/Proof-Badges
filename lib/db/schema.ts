import { pgTable, varchar, text, integer, bigint, boolean, char, timestamp, numeric } from "drizzle-orm/pg-core";

export const campaigns = pgTable("campaigns", {
  campaignId: numeric("campaign_id", { precision: 78, scale: 0 }).primaryKey(),
  name: varchar("name", { length: 80 }).notNull(),
  description: varchar("description", { length: 500 }).notNull().default(""),
  imageUrl: text("image_url").notNull(),
  maxSupply: integer("max_supply").notNull(),
  startTime: bigint("start_time", { mode: "number" }).notNull(),
  endTime: bigint("end_time", { mode: "number" }).notNull(),
  soulbound: boolean("soulbound").notNull(),
  creator: char("creator", { length: 42 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
