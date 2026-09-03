import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_FILE = path.join(__dirname, "..", "data", "resources.json");

function readResources() {
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf8");
    const data = JSON.parse(raw);

    if (!Array.isArray(data)) {
      return [];
    }

    return data;
  } catch (error) {
    console.error("HAMOU MATH resources error:", error);
    return [];
  }
}

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function matches(resource, q) {
  if (!q) return true;

  const text = [
    resource.title,
    resource.titleAr,
    resource.description,
    resource.author,
    resource.source,
    resource.field,
    resource.fieldAr,
    resource.level,
    resource.levelAr,
    resource.type,
    resource.typeAr,
    ...(resource.keywords || [])
  ]
    .map(normalize)
    .join(" ");

  return text.includes(q);
}

export default function handler(req, res) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");

  res.setHeader(
    "Cache-Control",
    "public, s-maxage=300, stale-while-revalidate=3600"
  );

  res.setHeader("Access-Control-Allow-Origin", "*");

  if (req.method === "OPTIONS") {
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET, OPTIONS"
    );

    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type"
    );

    return res.status(204).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({
      success: false,
      error: "Method Not Allowed"
    });
  }

  const allResources = readResources();

  const q = normalize(req.query?.q);
  const type = normalize(req.query?.type);
  const field = normalize(req.query?.field);
  const level = normalize(req.query?.level);
  const language = normalize(req.query?.language);

  let filtered = allResources.filter((resource) => {
    if (!matches(resource, q)) {
      return false;
    }

    if (
      type &&
      normalize(resource.type) !== type &&
      normalize(resource.typeAr) !== type
    ) {
      return false;
    }

    if (
      field &&
      normalize(resource.field) !== field &&
      normalize(resource.fieldAr) !== field
    ) {
      return false;
    }

    if (
      level &&
      normalize(resource.level) !== level &&
      normalize(resource.levelAr) !== level
    ) {
      return false;
    }

    if (
      language &&
      normalize(resource.language) !== language
    ) {
      return false;
    }

    return true;
  });

  const page = Math.max(
    1,
    Number.parseInt(req.query?.page || "1", 10) || 1
  );

  const requestedLimit = Number.parseInt(
    req.query?.limit || "50",
    10
  ) || 50;

  const limit = Math.min(
    Math.max(requestedLimit, 1),
    100
  );

  const total = filtered.length;
  const totalPages = Math.max(
    1,
    Math.ceil(total / limit)
  );

  const safePage = Math.min(page, totalPages);

  const start = (safePage - 1) * limit;

  const resources = filtered.slice(
    start,
    start + limit
  );

  return res.status(200).json({
    success: true,
    platform: "HAMOU MATH GLOBAL",
    version: "20.1.0",
    total,
    page: safePage,
    limit,
    totalPages,
    hasNextPage: safePage < totalPages,
    hasPreviousPage: safePage > 1,
    resources
  });
}
