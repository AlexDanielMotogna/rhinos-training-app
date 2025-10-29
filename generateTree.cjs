const fs = require("fs");
const path = require("path");

function generateTree(dir, depth = 0, maxDepth = 3) {
  if (depth > maxDepth) return "";

  let result = "";
  const indent = "│   ".repeat(depth);

  fs.readdirSync(dir, { withFileTypes: true }).forEach((entry, index, arr) => {
    const isLast = index === arr.length - 1;
    const prefix = indent + (isLast ? "└── " : "├── ");
    result += prefix + entry.name + "\n";

    if (entry.isDirectory()) {
      result += generateTree(path.join(dir, entry.name), depth + 1, maxDepth);
    }
  });

  return result;
}

const tree = generateTree(process.cwd(), 0, 3);
fs.writeFileSync("tree.txt", tree, "utf-8");
console.log("✅ Project tree saved in tree.txt");
