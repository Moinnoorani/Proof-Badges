// migrate-and-seed.mjs
// Creates the campaigns table and seeds demo data on Neon DB

import postgres from "postgres";

const DATABASE_URL =
  "postgresql://neondb_owner:npg_uVtdKqZbWY86@ep-still-mode-ape8puhj-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

const sql = postgres(DATABASE_URL, { ssl: "require" });

async function migrate() {
  console.log("🔧 Creating campaigns table...");
  await sql`
    CREATE TABLE IF NOT EXISTS campaigns (
      campaign_id   NUMERIC(78, 0) PRIMARY KEY,
      name          VARCHAR(80)    NOT NULL,
      description   VARCHAR(500)   NOT NULL DEFAULT '',
      image_url     TEXT           NOT NULL,
      max_supply    INTEGER        NOT NULL,
      minted_count  INTEGER        NOT NULL DEFAULT 0,
      start_time    BIGINT         NOT NULL,
      end_time      BIGINT         NOT NULL,
      soulbound     BOOLEAN        NOT NULL,
      creator       CHAR(42)       NOT NULL,
      created_at    TIMESTAMPTZ    NOT NULL DEFAULT NOW()
    );
  `;
  console.log("✅ Table ready.");
}

async function seed() {
  const now = Math.floor(Date.now() / 1000);
  const oneWeek = 7 * 24 * 60 * 60;
  const oneMonth = 30 * 24 * 60 * 60;

  const demos = [
    {
      campaign_id: "1001",
      name: "UGF Early Adopter Badge",
      description: "Awarded to early adopters who claimed a gasless badge using UGF on Base Sepolia. No ETH needed — just Mock USD.",
      image_url: "https://images.unsplash.com/photo-1639762681057-408e52192e55?w=600&h=600&fit=crop",
      max_supply: 500,
      minted_count: 127,
      start_time: now - oneWeek,
      end_time: now + oneMonth,
      soulbound: true,
      creator: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
    },
    {
      campaign_id: "1002",
      name: "Hackathon Builder 2025",
      description: "Exclusive badge for builders who participated in the UGF Hackathon 2025. Claim yours gaslessly with Mock USD.",
      image_url: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&h=600&fit=crop",
      max_supply: 200,
      minted_count: 43,
      start_time: now - 2 * oneWeek,
      end_time: now + 2 * oneWeek,
      soulbound: false,
      creator: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
    },
    {
      campaign_id: "1003",
      name: "Base Sepolia Pioneer",
      description: "For pioneers who took their first steps on Base Sepolia using gasless transactions powered by UGF.",
      image_url: "https://images.unsplash.com/photo-1620321023374-d1a68fbc720d?w=600&h=600&fit=crop",
      max_supply: 1000,
      minted_count: 312,
      start_time: now - oneMonth,
      end_time: now + oneWeek,
      soulbound: true,
      creator: "0xab5801a7d398351b8be11c439e05c5b3259aec9b",
    },
  ];

  console.log("🌱 Seeding demo campaigns...");
  for (const c of demos) {
    await sql`
      INSERT INTO campaigns (
        campaign_id, name, description, image_url,
        max_supply, minted_count, start_time, end_time, soulbound, creator
      ) VALUES (
        ${c.campaign_id}, ${c.name}, ${c.description}, ${c.image_url},
        ${c.max_supply}, ${c.minted_count}, ${c.start_time}, ${c.end_time},
        ${c.soulbound}, ${c.creator}
      )
      ON CONFLICT (campaign_id) DO NOTHING;
    `;
    console.log(`  ✅ "${c.name}"`);
  }
  console.log("🎉 Seed complete!");
}

async function main() {
  try {
    await migrate();
    await seed();
  } catch (err) {
    console.error("❌ Error:", err);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

main();
