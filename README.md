# PFx Rename X

PFx Rename X is an open-source, UI-independent batch file renaming engine for deterministic rule pipelines, previews, validation, conflict detection, and rename manifests.

## v0.2 scope

The repository contains the core engine only. It does not read, write, rename, ZIP, or upload real files. Filesystem adapters and user interfaces belong in higher layers.

## Core goals

- Pure TypeScript core
- Zero runtime dependencies
- No browser or framework coupling
- Deterministic rename previews
- Extensible, versioned rule registry
- Validation before execution

## Development

```bash
npm install
npm run check
```

Build output is generated in `dist/` and is intentionally not committed.

## Public API contract

Only imports from the package root are supported:

```ts
import { rename, prefix, type RenameRequest } from "@pfxamd/rename-x";
```

Internal file paths are not part of the public contract. Runtime exports and public TypeScript types are explicitly enumerated in `src/index.ts` and protected by API contract tests.

## Example

```ts
import {
  rename,
  prefix,
  caseTransform,
  counter,
  extension,
} from "@pfxamd/rename-x";

const result = rename({
  files: [
    { id: "1", originalName: "IMG 01.JPG" },
    { id: "2", originalName: "IMG 02.JPG" },
  ],
  rules: [
    caseTransform("lowercase"),
    prefix("trip-"),
    counter({ start: 1, padding: 3 }),
    extension({ mode: "lowercase" }),
  ],
  options: {
    extensionPolicy: "allow-change",
  },
});
```


## Safety defaults

- `originalName` must be a filename, not a filesystem path.
- Duplicate input IDs are rejected.
- Output conflicts are checked case-insensitively by default.
- Unicode collision detection uses NFC normalization by default and can be disabled with `unicodeNormalization: "none"`.
- A manifest is never emitted when output names conflict, even when `conflictStrategy` is set to `"warn"`.
- `maxNameLength` counts Unicode code points rather than UTF-16 code units.

## Built-in rules

- Prefix
- Suffix
- Find / Replace
- Remove
- Case transform
- Counter
- Date
- Extension
- Trim
- Sanitize
- Regex Replace
- Slugify
- Insert
- Character Filter
- Number Range
- Template

### v0.2 rule notes

- `regexReplace()` supports native JavaScript regular-expression capture replacement.
- `slugify()` is Unicode-aware and keeps non-Latin letters by default.
- `insert()` uses Unicode code-point positions.
- `numberRange()` validates that the configured range can cover the whole batch before execution.
- `template()` supports `{name}`, `{original}`, `{index}`, `{index0}`, and `{total}`.

## Architecture

```text
Input
→ Parse filename
→ Validate rules
→ Apply enabled rules in order
→ Validate filenames
→ Detect collection conflicts
→ Build preview
→ Build manifest
```

The engine knows the rule contract, not individual rule implementations. New rule handlers can be registered without changing the engine.

## License

Apache-2.0
