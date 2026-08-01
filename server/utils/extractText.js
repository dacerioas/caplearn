const fs = require("fs/promises");
const path = require("path");
const { parseOffice } = require("officeparser");

const PLAIN_TEXT_EXTENSIONS = new Set([".txt", ".md"]);

async function extractText(filePath) {
  const ext = path.extname(filePath).toLowerCase();

  if (PLAIN_TEXT_EXTENSIONS.has(ext)) {
    return fs.readFile(filePath, "utf-8");
  }

  const ast = await parseOffice(filePath);
  return ast.toText();
}

module.exports = { extractText };
