import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// ---------- storage ----------
const DATA_DIR = path.join(__dirname, "data");
const INVENTORY_FILE = path.join(DATA_DIR, "inventory.json");

async function ensureDataFile() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try { await fs.access(INVENTORY_FILE); }
  catch { await fs.writeFile(INVENTORY_FILE, "[]", "utf8"); }
}
async function readInventory() {
  await ensureDataFile();
  try { return JSON.parse(await fs.readFile(INVENTORY_FILE, "utf8") || "[]"); }
  catch { return []; }
}
async function writeInventory(items: any[]) {
  await ensureDataFile();
  await fs.writeFile(INVENTORY_FILE, JSON.stringify(items, null, 2), "utf8");
}

// ---------- middleware ----------
app.use(cors());
app.use(express.json({ limit: "10mb" }));

function adminOnly(req: any, res: any, next: any) {
  const token = req.header("x-admin-token");
  if (!process.env.ADMIN_TOKEN) return res.status(500).json({ error: "ADMIN_TOKEN not set" });
  if (token !== process.env.ADMIN_TOKEN) return res.status(401).json({ error: "Unauthorized" });
  next();
}

// ---------- routes ----------
app.get("/health", (_req, res) => res.json({ ok: true }));

app.get("/inventory", async (_req, res) => {
  res.json(await readInventory());
});

app.post("/admin/inventory/replace", adminOnly, async (req, res) => {
  const items = Array.isArray(req.body?.items) ? req.body.items : [];
  const normalized = items.map((r: any) => {
    const sku = String(r.sku ?? r.id ?? `${r.set ?? ""}|${r.number ?? ""}|${r.name ?? ""}`);
    return { id: r.id ?? sku, sku, name: r.name ?? "Unknown", quantity: Number(r.quantity ?? 0), ...r };
  });
  await writeInventory(normalized);
  res.json({ ok: true, replaced: normalized.length });
});

app.post("/admin/inventory/bulk-upsert", adminOnly, async (req, res) => {
  const incoming = Array.isArray(req.body?.items) ? req.body.items : [];
  const current: any[] = await readInventory();
  const bySku = new Map<string, any>(current.map(i => [String(i.sku), i]));
  let added = 0, updated = 0;

  for (const r of incoming) {
    const sku = String(r.sku ?? r.id ?? `${r.set ?? ""}|${r.number ?? ""}|${r.name ?? ""}`);
    const next = { id: r.id ?? sku, sku, name: r.name ?? "Unknown", quantity: Number(r.quantity ?? 0), ...r };
    if (bySku.has(sku)) { bySku.set(sku, { ...bySku.get(sku), ...next }); updated++; }
    else { bySku.set(sku, next); added++; }
  }
  const final = Array.from(bySku.values());
  await writeInventory(final);
  res.json({ ok: true, added, updated, total: final.length });
});

app.post("/orders/complete", async (req, res) => {
  const lines = Array.isArray(req.body?.lines) ? req.body.lines : [];
  if (!lines.length) return res.status(400).json({ error: "No lines provided" });

  const current: any[] = await readInventory();
  const bySku = new Map<string, any>(current.map(i => [String(i.sku), i]));
  const changes: any[] = [];

  for (const l of lines) {
    const sku = String(l.sku);
    const qty = Math.max(0, Number(l.quantity || 0));
    if (!bySku.has(sku)) continue;
    const item = { ...bySku.get(sku) };
    const before = Number(item.quantity || 0);
    const after = Math.max(0, before - qty);
    item.quantity = after;
    bySku.set(sku, item);
    changes.push({ sku, before, purchased: qty, after });
  }

  const final = Array.from(bySku.values());
  await writeInventory(final);
  res.json({ ok: true, lines: changes, orderId: req.body?.orderId ?? null });
});

app.get("/inventory/export.csv", adminOnly, async (_req, res) => {
  const items: any[] = await readInventory();
  const headers = ["id","sku","name","set","number","rarity","condition","price","quantity","imageUrl"];
  const esc = (v: any) => `"${String(v ?? "").replaceAll(`"`,`""`)}"`;
  const rows = [headers.join(",")].concat(items.map(i => headers.map(h => esc(i[h])).join(",")));
  res.setHeader("Content-Type", "text/csv");
  res.send(rows.join("\n"));
});

// ---------- start ----------
app.listen(Number(PORT), "0.0.0.0", () => {
  console.log(`Rivals API listening on http://localhost:${PORT}`);
});
