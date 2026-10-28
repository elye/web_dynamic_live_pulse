#!/usr/bin/env node
// Scaffolds a new question type: copies a template into src/questions/types/<kind>/ and
// registers it in registry.ts and the five UI registries. Usage:
//   npm run new:question -- <kind> [--label "Shown name"] [--template text|choice]
// Read AGENTS.md for what to fill in afterwards.
import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const questions = join(root, "src", "questions");
const templates = join(root, "scripts", "question-templates");

const reserved = new Set(
  "break case catch class const continue debugger default delete do else enum export extends false finally for function if import in instanceof new null return super switch this throw true try typeof var void while with yield let static await async".split(
    " ",
  ),
);

/** [registry file, export name, per-type file]; each registry is typed Record<Kind, ...>. */
const uiSeams = [
  ["metaRegistry.ts", "meta", "ui"],
  ["resultsRegistry.ts", "results", "results"],
  ["inputRegistry.ts", "input", "input"],
  ["editorRegistry.ts", "editor", "editor"],
  ["authorRegistry.ts", "author", "author"],
];

function fail(message) {
  console.error(`new:question: ${message}`);
  process.exit(1);
}

function parseArguments(argv) {
  const options = { template: "text" };
  const positional = [];
  for (let index = 0; index < argv.length; index++) {
    const argument = argv[index];
    if (argument === "--label") options.label = argv[++index];
    else if (argument === "--template") options.template = argv[++index];
    else if (argument.startsWith("--")) fail(`unknown option ${argument}`);
    else positional.push(argument);
  }
  return { options, positional };
}

const { options, positional } = parseArguments(process.argv.slice(2));
const kind = positional[0];
if (!kind || positional.length > 1)
  fail(
    'usage: npm run new:question -- <kind> [--label "Shown name"] [--template text|choice]',
  );
if (!/^[a-z][a-z0-9]{1,23}$/.test(kind) || reserved.has(kind))
  fail(
    "the kind must be 2-24 lowercase letters or digits, start with a letter and not be a reserved word. It is stored in saved sessions and cannot be renamed later.",
  );
const available = readdirSync(templates);
if (!available.includes(options.template))
  fail(
    `unknown template "${options.template}". Choose: ${available.join(", ")}`,
  );
const label = options.label || kind.charAt(0).toUpperCase() + kind.slice(1);
if (/["\\\n]/.test(label))
  fail("the label must not contain quotes or backslashes.");

const folder = join(questions, "types", kind);
if (existsSync(folder)) fail(`src/questions/types/${kind} already exists.`);

// Work out every edit first so a problem leaves the repository untouched.
const edits = new Map();

function readSource(path) {
  if (!edits.has(path)) edits.set(path, readFileSync(path, "utf8"));
  return edits.get(path);
}

function insertAfterLastImport(path, line) {
  const source = readSource(path);
  const lines = source.split("\n");
  let last = -1;
  lines.forEach((text, index) => {
    if (/^import .* from ".*";$/.test(text)) last = index;
  });
  if (last < 0) fail(`no imports found in ${path}`);
  lines.splice(last + 1, 0, line);
  edits.set(path, lines.join("\n"));
}

function insertBefore(path, marker, line, fromIndex = 0) {
  const source = readSource(path);
  const at = source.indexOf(marker, fromIndex);
  if (at < 0) fail(`could not find "${marker.trim()}" in ${path}`);
  edits.set(path, source.slice(0, at) + line + source.slice(at));
}

const registryPath = join(questions, "registry.ts");
if (readSource(registryPath).includes(`./types/${kind}/`))
  fail(`"${kind}" already appears in registry.ts.`);
insertAfterLastImport(
  registryPath,
  `import { ${kind} } from "./types/${kind}/definition.ts";`,
);
insertBefore(registryPath, "] as const;", `  ${kind},\n`);

for (const [file, name, source] of uiSeams) {
  const path = join(questions, "ui", file);
  insertAfterLastImport(
    path,
    `import { ${name} as ${kind} } from "../types/${kind}/${source}";`,
  );
  const declaration = readSource(path).indexOf("Record<Kind,");
  if (declaration < 0)
    fail(`could not find the Record<Kind, ...> map in ${path}`);
  insertBefore(path, "\n};", `\n  ${kind},`, declaration);
}

const created = [];
mkdirSync(folder, { recursive: true });
const templateFolder = join(templates, options.template);
for (const name of readdirSync(templateFolder)) {
  const target = join(folder, name.replace(/\.tpl$/, ""));
  const content = readFileSync(join(templateFolder, name), "utf8")
    .replaceAll("__KIND__", kind)
    .replaceAll("__LABEL__", label);
  writeFileSync(target, content);
  created.push(target);
}
for (const [path, content] of edits) writeFileSync(path, content);

// Format only what was touched. Prettier is optional here; skip quietly if it is missing.
spawnSync("npx", ["prettier", "--write", ...created, ...edits.keys()], {
  cwd: root,
  stdio: "ignore",
});

console.log(`Created src/questions/types/${kind}/ and registered "${kind}".

Next (full checklist in AGENTS.md):
  1. Replace every TODO(new-question) in src/questions/types/${kind}/.
  2. If the type adds fields, add them to QuestionRecord (platform/types.ts) and list them in \`settings\`.
  3. npm run lint && npx tsc -b && npm test   (npm test fails while any TODO(new-question) remains)
  4. Add a Playwright spec for any behaviour unique to the type.`);
