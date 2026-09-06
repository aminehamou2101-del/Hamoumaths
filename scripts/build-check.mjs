import fs from "node:fs";
import path from "node:path";

const required = [
  "index.html",
  "package.json",
  "manifest.json",
  "vercel.json"
];

let failed = false;

for (const file of required) {
  if (!fs.existsSync(path.resolve(file))) {
    console.error(`Missing required file: ${file}`);
    failed = true;
  }
}

const html = fs.readFileSync("index.html", "utf8");

if (!html.includes("<!DOCTYPE html>")) {
  console.error("index.html: missing DOCTYPE");
  failed = true;
}

if (!html.includes("</html>")) {
  console.error("index.html: missing closing html tag");
  failed = true;
}

if (failed) {
  process.exit(1);
}

console.log("HAMOU MATH production checks passed.");
