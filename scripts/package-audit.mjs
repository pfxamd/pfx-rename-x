import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd,
    encoding: "utf8",
    stdio: options.stdio ?? "pipe",
    env: process.env,
  });

  if (result.status !== 0) {
    throw new Error(
      [
        `Command failed: ${command} ${args.join(" ")}`,
        result.stdout,
        result.stderr,
      ]
        .filter(Boolean)
        .join("\n"),
    );
  }

  return result.stdout ?? "";
}

const root = resolve(process.cwd());
const pkg = JSON.parse(await readFile(join(root, "package.json"), "utf8"));

assert.equal(pkg.type, "module");
assert.equal(pkg.sideEffects, false);
assert.equal(pkg.dependencies, undefined);
assert.equal(pkg.exports?.["."]?.import, "./dist/index.js");
assert.equal(pkg.exports?.["."]?.types, "./dist/index.d.ts");

run("npm", ["run", "build"], { cwd: root });

const packed = JSON.parse(run("npm", ["pack", "--json", "--ignore-scripts"], { cwd: root }));
assert.equal(packed.length, 1);

const packageInfo = packed[0];
const tarball = join(root, packageInfo.filename);
const files = packageInfo.files.map((file) => file.path);

for (const required of ["package.json", "README.md", "LICENSE", "dist/index.js", "dist/index.d.ts"]) {
  assert(files.includes(required), `Packed package is missing ${required}`);
}

for (const forbiddenPrefix of ["src/", "tests/", ".github/", "scripts/"]) {
  assert(
    !files.some((file) => file.startsWith(forbiddenPrefix)),
    `Packed package unexpectedly contains ${forbiddenPrefix}`,
  );
}

const consumerDir = await mkdtemp(join(tmpdir(), "pfx-rename-x-consumer-"));

try {
  await writeFile(
    join(consumerDir, "package.json"),
    JSON.stringify({ private: true, type: "module" }, null, 2),
  );

  run(
    "npm",
    ["install", "--ignore-scripts", "--no-audit", "--no-fund", tarball],
    { cwd: consumerDir },
  );

  await writeFile(
    join(consumerDir, "consumer.mjs"),
    `import { rename, prefix, slugify, template } from "@pfxamd/rename-x";

const result = rename({
  files: [{ id: "1", originalName: "Crème Draft.JPG" }],
  rules: [
    slugify(),
    prefix("photo-"),
    template({ pattern: "{index}-{name}", padding: 2 }),
  ],
});

if (!result.valid) throw new Error("Consumer runtime result is invalid");
if (result.preview.items[0]?.newName !== "01-photo-creme-draft.JPG") {
  throw new Error(\`Unexpected consumer output: \${result.preview.items[0]?.newName}\`);
}
`,
  );

  run(process.execPath, ["consumer.mjs"], { cwd: consumerDir });

  await writeFile(
    join(consumerDir, "consumer.ts"),
    `import {
  rename,
  numberRange,
  type RenameRequest,
  type RenameResult,
} from "@pfxamd/rename-x";

const request: RenameRequest = {
  files: [{ id: "1", originalName: "file.txt" }],
  rules: [numberRange({ start: 1, end: 1 })],
};

const result: RenameResult = rename(request);
void result;
`,
  );

  await writeFile(
    join(consumerDir, "tsconfig.json"),
    JSON.stringify(
      {
        compilerOptions: {
          target: "ES2022",
          module: "NodeNext",
          moduleResolution: "NodeNext",
          strict: true,
          noEmit: true,
          skipLibCheck: false,
        },
        include: ["consumer.ts"],
      },
      null,
      2,
    ),
  );

  const tsc = join(root, "node_modules", "typescript", "lib", "tsc.js");
  run(process.execPath, [tsc, "-p", join(consumerDir, "tsconfig.json")], {
    cwd: consumerDir,
  });

  console.log(
    JSON.stringify(
      {
        package: `${pkg.name}@${pkg.version}`,
        packedFiles: files.length,
        packedSize: packageInfo.size,
        unpackedSize: packageInfo.unpackedSize,
        runtimeDependencies: 0,
        esmConsumer: "ok",
        typescriptConsumer: "ok",
      },
      null,
      2,
    ),
  );
} finally {
  await rm(consumerDir, { recursive: true, force: true });
  await rm(tarball, { force: true });
}
