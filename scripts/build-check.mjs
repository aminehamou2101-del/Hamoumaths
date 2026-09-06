import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const dist = path.join(root, "dist");

const required = [
  "index.html",
  "manifest.json"
];

let failed = false;

// Check required files
for (const file of required) {
  if (!fs.existsSync(path.join(root, file))) {
    console.error(`Missing required file: ${file}`);
    failed = true;
  }
}

if (failed) {
  process.exit(1);
}

// Clean dist
fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });

// Copy main static files
const filesToCopy = [
  "index.html",
  "manifest.json",
  "favicon.svg",
  "robots.txt",
  "sitemap.xml"
];

for (const file of filesToCopy) {
  const source = path.join(root, file);

  if (fs.existsSync(source)) {
    fs.copyFileSync(source, path.join(dist, file));
    console.log(`Copied: ${file}`);
  }
}

// Copy static directories when they exist
const directoriesToCopy = [
  "assets",
  "images",
  "icons",
  "lessons",
  "memoranda",
  "data"
];

function copyDirectory(source, destination) {
  if (!fs.existsSync(source)) return;

  fs.mkdirSync(destination, { recursive: true });

  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    const src = path.join(source, entry.name);
    const dest = path.join(destination, entry.name);

    if (entry.isDirectory()) {
      copyDirectory(src, dest);
    } else {
      fs.copyFileSync(src, dest);
    }
  }
}

for (const directory of directoriesToCopy) {
  const source = path.join(root, directory);

  if (fs.existsSync(source)) {
    copyDirectory(source, path.join(dist, directory));
    console.log(`Copied directory: ${directory}`);
  }
}

console.log("HAMOU MATH Cloudflare build completed successfully.");
console.log(`Output directory: ${dist}`);
