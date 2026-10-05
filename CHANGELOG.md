# Changelog

## Unreleased

- Hardened request and option validation.
- Reject path-like filenames and duplicate input IDs.
- Added NFC/NFD Unicode collision detection.
- Made locale-aware case transforms deterministic.
- Treat replacement strings literally in find/replace and sanitize rules.
- Prevent manifests from being emitted for warning-level output conflicts.
- Added portable trailing-dot/space validation and Unicode-aware length checks.
- Added an extended edge-case and 10,000-file test suite.

## 0.1.0

- Initial core architecture
- PFx shared rule registry primitive and versioned rule contract
- 10 built-in rename rules
- Preview and manifest generation
- Manifests are emitted only for valid previews
- Filename validation and conflict detection
- Deterministic date support
