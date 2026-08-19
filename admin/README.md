# Student Nexus - Desktop Application (Electron)

A cross-platform desktop application for Student Nexus built with Electron.

## Features

- ✅ Cross-platform support (Windows, macOS, Linux)
- ✅ Native desktop experience
- ✅ Offline capability
- ✅ System tray integration ready
- ✅ Auto-updates support ready

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn

## Installation

1. Navigate to the desktop folder:
```bash
cd desktop
```

2. Install dependencies:
```bash
npm install
```

## Development

Start the application in development mode:
```bash
npm start
```

## Building

Build for your current platform:
```bash
npm run build
```

Build for specific platforms:
```bash
# Windows
npm run build:win

# macOS
npm run build:mac

# Linux
npm run build:linux
```

## Project Structure

```
desktop/
├── main.js              # Electron main process
├── preload.js           # Preload script for security
├── renderer/            # Renderer process (UI)
│   ├── index.html       # Main HTML file
│   ├── styles.css       # Styles
│   └── renderer.js      # Renderer JavaScript
├── assets/              # App icons and assets
├── package.json         # Dependencies and scripts
└── README.md           # This file
```

## Main Process (main.js)

Handles:
- Window creation and management
- System integration
- Native menus
- App lifecycle

## Renderer Process (renderer/)

Contains:
- HTML/CSS/JavaScript for the UI
- Same design as the web version
- Electron-specific features access through IPC

## Security

This app follows Electron security best practices:
- Context isolation enabled
- Node integration disabled
- Secure IPC communication via preload script

## Distribution

The built application will be in the `dist/` folder after running build commands.

## License

Proprietary and confidential.
