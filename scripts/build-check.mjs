import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const dist = path.join(root, "dist");

const required = [
  "index.html",
  "manifest.json"
];

let failed = false;

// ================================
// 1. Check required files
// ================================
for (const file of required) {
  if (!fs.existsSync(path.join(root, file))) {
    console.error(`Missing required file: ${file}`);
    failed = true;
  }
}

if (failed) {
  process.exit(1);
}

// ================================
// 2. Clean dist
// ================================
fs.rmSync(dist, {
  recursive: true,
  force: true
});

fs.mkdirSync(dist, {
  recursive: true
});

// ================================
// 3. Copy static files
// ================================
const filesToCopy = [
  "index.html",
  "manifest.json",
  "manifest.webmanifest",
  "favicon.svg",
  "robots.txt",
  "sitemap.xml",

  // PWA
  "service-worker.js",
  "sw.js",

  // Other static pages
  "404.html",
  "math-lab.html"
];

for (const file of filesToCopy) {
  const source = path.join(root, file);
  const destination = path.join(dist, file);

  if (fs.existsSync(source)) {
    fs.copyFileSync(source, destination);
    console.log(`Copied: ${file}`);
  } else {
    console.log(`Skipped missing file: ${file}`);
  }
}

// ================================
// 4. Copy static directories
// ================================
const directoriesToCopy = [
  "assets",
  "images",
  "icons",
  "lessons",
  "memoranda",
  "data",
  "annales",
  "exercises",
  "archive"
];

function copyDirectory(source, destination) {
  if (!fs.existsSync(source)) {
    return;
  }

  fs.mkdirSync(destination, {
    recursive: true
  });

  for (const entry of fs.readdirSync(source, {
    withFileTypes: true
  })) {
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
    copyDirectory(
      source,
      path.join(dist, directory)
    );

    console.log(`Copied directory: ${directory}`);
  } else {
    console.log(`Skipped missing directory: ${directory}`);
  }
}

// ================================
// 5. Verify important output
// ================================
const verifyFiles = [
  "index.html",
  "manifest.json"
];

for (const file of verifyFiles) {
  if (!fs.existsSync(path.join(dist, file))) {
    console.error(`Build verification failed: ${file}`);
    process.exit(1);
  }
}

// ================================
// 6. Verify Service Worker
// ================================
if (
  !fs.existsSync(path.join(dist, "service-worker.js")) &&
  !fs.existsSync(path.join(dist, "sw.js"))
) {
  console.warn(
    "Warning: No service worker found in dist."
  );
}

// ================================
// 7. Final report
// ================================
console.log("");
console.log("========================================");
console.log(" HAMOU MATH BUILD COMPLETED SUCCESSFULLY");
console.log("========================================");
console.log(`Output directory: ${dist}`);
console.log("");
