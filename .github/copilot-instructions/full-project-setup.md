# Full Project Setup for Testing

This document provides complete instructions for setting up and running the CommandLineTanks project locally with both backend (SpacetimeDB) and frontend components.

## Prerequisites

- .NET 8.0 SDK
- Node.js 18+ and npm
- SpacetimeDB CLI version 1.10.0 (CRITICAL: Must be exactly this version)

## Step 1: Install SpacetimeDB CLI v1.10.0

**IMPORTANT:** The project requires SpacetimeDB CLI version 1.10.0 exactly. Other versions (including 1.11.x) are NOT compatible.

```bash
curl -sSL "https://github.com/clockworklabs/SpacetimeDB/releases/download/v1.10.0/spacetime-x86_64-unknown-linux-gnu.tar.gz" -o spacetime.tar.gz
tar -xzf spacetime.tar.gz
mkdir -p ~/.local/bin
cp spacetimedb-cli ~/.local/bin/spacetime
cp spacetimedb-standalone ~/.local/bin/
```

Verify installation:
```bash
spacetime --version
```
Should output: `spacetimedb tool version 1.10.0; spacetimedb-lib version 1.10.0;`

## Step 2: Start SpacetimeDB Server

Start the local SpacetimeDB server in the background:

```bash
spacetime start
```

The server will run on `ws://localhost:3000` by default.

To verify the server is running:
```bash
ps aux | grep spacetime
```

## Step 3: Build Backend (C#)

Navigate to the backend directory and build the project:

```bash
cd backend/spacetimedb
dotnet build
```

The build will produce WASM output. Warnings about lower-cased type names are expected and acceptable. Only errors should be addressed.

## Step 4: Publish Backend to SpacetimeDB

From the repository root, publish the backend module to the local SpacetimeDB instance:

```bash
spacetime publish -c --project-path backend/spacetimedb clt -y
```

This command:
- `-c` clears existing data
- `--project-path` specifies the backend project location
- `clt` is the module name
- `-y` skips confirmation prompts

Expected output should show successful publication with a database identity.

## Step 5: Install Frontend Dependencies

Navigate to the frontend directory and install dependencies:

```bash
cd frontend
npm install
```

## Step 6: Build Frontend (Verification)

Verify the frontend builds without errors:

```bash
npm run build
```

Warnings are acceptable, but there should be no errors. The build creates optimized production files in the `dist/` directory.

## Step 7: Start Frontend Development Server

Start the frontend development server:

```bash
npm run dev
```

The frontend will start on `http://localhost:5173` (or another port if 5173 is in use).

## Step 8: Access the Game

Open your browser and navigate to the URL shown in the terminal (typically `http://localhost:5173`).

The game should:
1. Load the homepage successfully
2. Connect to SpacetimeDB on `ws://localhost:3000`
3. Show the game interface with the terminal input
4. Display tanks and game elements on the canvas

## Verification Checklist

- [ ] SpacetimeDB CLI version 1.10.0 installed
- [ ] SpacetimeDB server running (`spacetime start`)
- [ ] Backend builds successfully (`dotnet build`)
- [ ] Backend published to SpacetimeDB (`spacetime publish`)
- [ ] Frontend dependencies installed (`npm install`)
- [ ] Frontend builds successfully (`npm run build`)
- [ ] Frontend dev server running (`npm run dev`)
- [ ] Game loads in browser with no connection errors
- [ ] Game canvas renders tanks and terrain

## Common Commands (Reference)

All commands are documented in `commands.txt` at the repository root:

1. **Generate TypeScript bindings** (after backend schema changes):
   ```bash
   spacetime generate --lang typescript --out-dir frontend/module_bindings --project-path backend/spacetimedb
   ```

2. **Query SpacetimeDB** (for debugging):
   ```bash
   spacetime sql clt "SELECT Id from game"
   ```

3. **Publish without clearing data**:
   ```bash
   spacetime publish --project-path backend/spacetimedb clt
   ```

## Troubleshooting

### SpacetimeDB Connection Issues

If the frontend shows connection errors:
1. Verify SpacetimeDB server is running: `ps aux | grep spacetime`
2. Check server logs for errors
3. Ensure the backend was published successfully

### Frontend Build Errors

If frontend build fails:
1. Check that frontend dependencies are installed: `npm install`
2. Verify SpacetimeDB SDK version matches CLI version (1.10.0) in `package.json`
3. If schema changed, regenerate TypeScript bindings

### Backend Build Errors

If backend build fails:
1. Ensure .NET 8.0 SDK is installed: `dotnet --version`
2. Check for syntax errors in C# code
3. Verify all dependencies are restored: `dotnet restore`

### Version Mismatch Issues

If you get type compatibility errors:
1. Verify CLI version is exactly 1.10.0: `spacetime --version`
2. Check SDK version in `frontend/package.json` is 1.10.0
3. Regenerate TypeScript bindings with correct CLI version

## Stopping Services

To stop the development environment:

1. Stop frontend dev server: Press `Ctrl+C` in the terminal running `npm run dev`
2. Stop SpacetimeDB server: `spacetime stop` or kill the process
3. To start fresh, clear SpacetimeDB data and republish backend with `-c` flag

## Screenshots

### Homepage
![Homepage showing game commands and syntax](screenshots/homepage.png)

### Game Running
![Game interface with tanks, terrain, and terminal](screenshots/game-running.png)
![Game with multiple tanks and projectiles](screenshots/game-with-tanks.png)

## Notes for AI Agents

- Always use SpacetimeDB CLI version 1.10.0 exactly
- The backend must be rebuilt and republished after C# code changes
- TypeScript bindings must be regenerated after backend schema changes
- Both backend and frontend builds must succeed before testing changes
- The SpacetimeDB server must be running before starting the frontend
- Frontend connects to `ws://localhost:3000` by default (configured in `.env.development`)
