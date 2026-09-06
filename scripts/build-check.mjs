import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = path.resolve(__dirname, "..");
const DIST = path.join(ROOT, "dist");

console.log("========================================");
console.log(" HAMOU MATH - Build Check");
console.log("========================================");
console.log("ROOT:", ROOT);
console.log("DIST:", DIST);

function removeDir(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, {
      recursive: true,
      force: true
    });
  }
}

function ensureDir(dir) {
  fs.mkdirSync(dir, {
    recursive: true
  });
}

function copyFile(relativePath) {
  const source = path.join(ROOT, relativePath);
  const target = path.join(DIST, relativePath);

  if (!fs.existsSync(source)) {
    console.log("Skipped missing file: " + relativePath);
    return false;
  }

  ensureDir(path.dirname(target));
  fs.copyFileSync(source, target);

  console.log("Copied: " + relativePath);
  return true;
}

function copyDirectory(relativePath) {
  const source = path.join(ROOT, relativePath);
  const target = path.join(DIST, relativePath);

  if (!fs.existsSync(source)) {
    console.log("Skipped missing directory: " + relativePath);
    return false;
  }

  fs.cpSync(source, target, {
    recursive: true,
    force: true
  });

  console.log("Copied directory: " + relativePath);
  return true;
}

console.log("");
console.log("Cleaning dist...");

removeDir(DIST);
ensureDir(DIST);

console.log("dist is ready");

console.log("");
console.log("Copying website files...");

const files = [
  "index.html",
  "admin.html",

  "manifest.json",
  "manifest.webmanifest",

  "service-worker.js",
  "sw.js",

  "robots.txt",
  "sitemap.xml",

  "404.html",

  "math-lab.html",

  "login.html",
  "register.html",
  "teacher.html",
  "student.html"
];

for (const file of files) {
  copyFile(file);
}

console.log("");
console.log("Copying website directories...");

const directories = [
  "assets",
  "images",
  "icons",

  "lessons",
  "memoranda",
  "data",

  "annales",
  "exercises",
  "archive",

  "books",
  "pdf",
  "tests",
  "exams",
  "courses",
  "uploads"
];

for (const directory of directories) {
  copyDirectory(directory);
}

console.log("");
console.log("Verifying build...");

const requiredFiles = [
  "index.html",
  "admin.html",
  "manifest.json"
];

let buildOK = true;

for (const file of requiredFiles) {
  const target = path.join(DIST, file);

  if (fs.existsSync(target)) {
    console.log("Verified: dist/" + file);
  } else {
    console.error("Missing required file: dist/" + file);
    buildOK = false;
  }
}

console.log("");
console.log("Verifying Owner dashboard...");

const adminPath = path.join(DIST, "admin.html");

if (fs.existsSync(adminPath)) {
  const adminSize = fs.statSync(adminPath).size;

  if (adminSize > 100) {
    console.log(
      "Owner dashboard ready: admin.html (" +
      adminSize +
      " bytes)"
    );
  } else {
    console.error(
      "admin.html exists but appears to be empty."
    );

    buildOK = false;
  }
} else {
  console.error(
    "Owner dashboard was not copied to dist."
  );

  buildOK = false;
}

console.log("");
console.log("Verifying index...");

const indexPath = path.join(DIST, "index.html");

if (fs.existsSync(indexPath)) {
  const indexSize = fs.statSync(indexPath).size;

  if (indexSize > 100) {
    console.log(
      "Main website ready: index.html (" +
      indexSize +
      " bytes)"
    );
  } else {
    console.error(
      "index.html exists but appears to be empty."
    );

    buildOK = false;
  }
} else {
  console.error(
    "index.html was not copied to dist."
  );

  buildOK = false;
}

console.log("");
console.log("Verifying service worker...");

const serviceWorkerPath = path.join(
  DIST,
  "service-worker.js"
);

const swPath = path.join(DIST, "sw.js");

if (fs.existsSync(serviceWorkerPath)) {
  console.log("service-worker.js available");
} else if (fs.existsSync(swPath)) {
  console.log("sw.js available");
} else {
  console.log("No service worker found.");
}

console.log("");
console.log("========================================");

if (buildOK) {
  console.log("HAMOU MATH BUILD SUCCESSFUL");
  console.log("========================================");

  console.log("Output directory:", DIST);
  console.log("Owner dashboard:", "dist/admin.html");
  console.log("Main website:", "dist/index.html");

  console.log("========================================");

  process.exit(0);
}

console.error("HAMOU MATH BUILD FAILED");
console.log("========================================");

process.exit(1);
