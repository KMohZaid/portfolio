import { readFile } from "node:fs/promises";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("Set DATABASE_URL to the direct PostgreSQL URL before seeding.");
const pool = new Pool({ connectionString, max: 1, ssl: { rejectUnauthorized: true } });

try {
  const sql = await readFile(new URL("../migrations/seed_demo_posts.sql", import.meta.url), "utf8");
  await pool.query(sql);
  const { rows } = await pool.query("SELECT title, slug FROM blog_posts WHERE slug = ANY($1::text[]) ORDER BY slug", [["introduction-to-python", "formatting-that-carries-meaning", "building-a-page-one-block-at-a-time", "images-belong-in-the-story", "build-a-telegram-translator-bot-with-python"]]);
  if (rows.length !== 5) throw new Error("Expected all five demo posts after seeding.");
  for (const { title, slug } of rows) console.log(`${title} (${slug})`);
} finally {
  await pool.end();
}
