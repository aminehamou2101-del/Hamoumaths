import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

const requiredFiles = [
  "index.html",
  "package.json",
  "manifest.json",
  "vercel.json"
];

let failed = false;

function checkFile(file) {
  const full = path.join(root, file);

  if (!fs.existsSync(full)) {
    console.error(`❌ Missing: ${file}`);
    failed = true;
    return null;
  }

  console.log(`✓ ${file}`);
  return fs.readFileSync(full, "utf8");
}

for (const file of requiredFiles) {
  checkFile(file);
}

const html = fs.readFileSync(
  path.join(root, "index.html"),
  "utf8"
);

if (!/^<!doctype html>/i.test(html.trim())) {
  console.error("❌ index.html must start with <!DOCTYPE html>");
  failed = true;
}

if (!/<html[\s>]/i.test(html)) {
  console.error("❌ <html> missing");
  failed = true;
}

if (!/<head[\s>]/i.test(html)) {
  console.error("❌ <head> missing");
  failed = true;
}

if (!/<body[\s>]/i.test(html)) {
  console.error("❌ <body> missing");
  failed = true;
}

if (!/<\/html>/i.test(html)) {
  console.error("❌ </html> missing");
  failed = true;
}

const packageJson = JSON.parse(
  fs.readFileSync(
    path.join(root, "package.json"),
    "utf8"
  )
);

if (!packageJson.scripts?.build) {
  console.error("❌ build script missing");
  failed = true;
}

if (!packageJson.engines?.node) {
  console.error("❌ Node version missing");
  failed = true;
}

if (failed) {
  console.error("\nHAMOU MATH build check FAILED.");
  process.exit(1);
}

console.log("\n================================");
console.log("HAMOU MATH BUILD CHECK PASSED");
console.log("================================");
