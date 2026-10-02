# VSCode Clean Filename

[![Release](https://img.shields.io/github/v/release/ThomasTSWD/VSCode-Clean-Filename)](https://github.com/ThomasTSWD/VSCode-Clean-Filename/releases/latest)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

Clean file names from the VS Code Explorer: no more accents, spaces or special characters.

## Features

- Cleans one file, several selected items, or a whole folder recursively
- `Café Crème (1).PDF` becomes `Cafe-Creme-1.pdf`
- Never overwrites an existing file, skips hidden files, hidden folders and `node_modules`
- Asks for confirmation before renaming several files
- No configuration required

## Installation

1. Download the latest `.vsix` from the [Releases](https://github.com/ThomasTSWD/VSCode-Clean-Filename/releases/latest) page
2. In VS Code, run **Extensions: Install from VSIX...** and select the file

## Usage

Right-click a file or folder in the Explorer and choose **Clean File Names**. The command is also available in the Command Palette for the active file.

## Requirements

Local files only. Virtual workspaces are not supported.

## Changelog

See [CHANGELOG.md](CHANGELOG.md).

## License

[MIT](LICENSE)
