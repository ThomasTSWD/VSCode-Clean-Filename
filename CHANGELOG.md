# Changelog

All notable changes to this project are documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and this project adheres to [Semantic Versioning](https://semver.org/).

## [1.3.0] - 2026-10-02

### Added

- Several files or folders selected in the Explorer are cleaned in one go
- Confirmation dialog listing the renames before several files are renamed
- Command available in the Command Palette for the active file
- Support for `ß`, `æ`, `œ`, `ø`, `đ` and `ł`

### Fixed

- Existing files are never overwritten: conflicting renames are skipped and reported
- Hidden files such as `.gitignore` are no longer renamed
- Hidden folders (`.git`) and `node_modules` are skipped during folder cleaning
- Files whose name would be empty once cleaned are left untouched
- A single failed rename no longer interrupts the others

### Changed

- Rewritten in TypeScript, with automated tests
- Command renamed to `clean-filename.clean`
- Messages are now in English
- Requires VS Code 1.120 or later

## [1.2.0] - 2026-04-24

### Changed

- Improved the cleaning regex
