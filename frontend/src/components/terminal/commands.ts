import { type DbConnection } from "../../../module_bindings";
import WorldVisibility from "../../../module_bindings/world_visibility_type";
import Gun from "../../../module_bindings/gun_type";
import { type Infer } from "spacetimedb";
import { setPendingJoinCode } from "../../spacetimedb-connection";
import * as themeColors from "../../theme/colors";

export function parseCommandInput(input: string): string[] {
  const args: string[] = [];
  let current = '';
  let inQuotes = false;
  let quoteChar = '';

  for (let i = 0; i < input.length; i++) {
    const char = input[i];

    if (char === '\\' && i + 1 < input.length && inQuotes) {
      const nextChar = input[i + 1];
      if (nextChar === quoteChar || nextChar === '\\') {
        current += nextChar;
        i++;
        continue;
      }
    }

    if ((char === '"' || char === "'") && !inQuotes) {
      inQuotes = true;
      quoteChar = char;
    } else if (char === quoteChar && inQuotes) {
      inQuotes = false;
      quoteChar = '';
    } else if (char === ' ' && !inQuotes) {
      if (current.length > 0) {
        args.push(current);
        current = '';
      }
    } else {
      current += char;
    }
  }

  if (current.length > 0) {
    args.push(current);
  }

  return args;
}

function findMyTank(connection: DbConnection, worldId: string) {
  if (!connection.identity) return null;
  for (const tank of connection.db.tank.iter()) {
    if (tank.worldId === worldId && tank.owner.isEqual(connection.identity)) {
      return tank;
    }
  }
  return null;
}

function findMyTankTransform(connection: DbConnection, worldId: string) {
  const tank = findMyTank(connection, worldId);
  if (!tank) return null;
  return connection.db.tankTransform.tankId.find(tank.id);
}

function isPlayerDead(connection: DbConnection, worldId: string): boolean {
  if (!connection.identity) {
    return false;
  }
  const tank = findMyTank(connection, worldId);
  return tank ? tank.health <= 0 : false;
}

const directionAliases: Record<
  string,
  { x: number; y: number; name: string; symbol: string }
> = {
  // North
  north: { x: 0, y: -1, name: "north", symbol: "↑" },
  up: { x: 0, y: -1, name: "north", symbol: "↑" },
  n: { x: 0, y: -1, name: "north", symbol: "↑" },
  u: { x: 0, y: -1, name: "north", symbol: "↑" },

  // Northeast
  northeast: { x: 1, y: -1, name: "northeast", symbol: "↗" },
  upright: { x: 1, y: -1, name: "northeast", symbol: "↗" },
  rightup: { x: 1, y: -1, name: "northeast", symbol: "↗" },
  ne: { x: 1, y: -1, name: "northeast", symbol: "↗" },
  ur: { x: 1, y: -1, name: "northeast", symbol: "↗" },
  ru: { x: 1, y: -1, name: "northeast", symbol: "↗" },

  // East
  east: { x: 1, y: 0, name: "east", symbol: "→" },
  right: { x: 1, y: 0, name: "east", symbol: "→" },
  e: { x: 1, y: 0, name: "east", symbol: "→" },
  r: { x: 1, y: 0, name: "east", symbol: "→" },

  // Southeast
  southeast: { x: 1, y: 1, name: "southeast", symbol: "↘" },
  downright: { x: 1, y: 1, name: "southeast", symbol: "↘" },
  rightdown: { x: 1, y: 1, name: "southeast", symbol: "↘" },
  se: { x: 1, y: 1, name: "southeast", symbol: "↘" },
  dr: { x: 1, y: 1, name: "southeast", symbol: "↘" },
  rd: { x: 1, y: 1, name: "southeast", symbol: "↘" },

  // South
  south: { x: 0, y: 1, name: "south", symbol: "↓" },
  down: { x: 0, y: 1, name: "south", symbol: "↓" },
  s: { x: 0, y: 1, name: "south", symbol: "↓" },
  d: { x: 0, y: 1, name: "south", symbol: "↓" },

  // Southwest
  southwest: { x: -1, y: 1, name: "southwest", symbol: "↙" },
  downleft: { x: -1, y: 1, name: "southwest", symbol: "↙" },
  leftdown: { x: -1, y: 1, name: "southwest", symbol: "↙" },
  sw: { x: -1, y: 1, name: "southwest", symbol: "↙" },
  dl: { x: -1, y: 1, name: "southwest", symbol: "↙" },
  ld: { x: -1, y: 1, name: "southwest", symbol: "↙" },

  // West
  west: { x: -1, y: 0, name: "west", symbol: "←" },
  left: { x: -1, y: 0, name: "west", symbol: "←" },
  w: { x: -1, y: 0, name: "west", symbol: "←" },
  l: { x: -1, y: 0, name: "west", symbol: "←" },

  // Northwest
  northwest: { x: -1, y: -1, name: "northwest", symbol: "↖" },
  upleft: { x: -1, y: -1, name: "northwest", symbol: "↖" },
  leftup: { x: -1, y: -1, name: "northwest", symbol: "↖" },
  nw: { x: -1, y: -1, name: "northwest", symbol: "↖" },
  ul: { x: -1, y: -1, name: "northwest", symbol: "↖" },
  lu: { x: -1, y: -1, name: "northwest", symbol: "↖" },
};

const validDirections = Object.keys(directionAliases);

function directionToAngle(direction: string): number {
  const dir = directionAliases[direction.toLowerCase()];
  if (!dir) return NaN;
  const mathAngle = Math.atan2(dir.y, dir.x);
  return mathAngle;
}

const allCommands = [
  { name: 'drive', alias: 'd' },
  { name: 'stop', alias: 's' },
  { name: 'aim', alias: 'a' },
  { name: 'fire', alias: 'f' },
  { name: 'tanks', alias: undefined }
];

function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix: number[][] = [];

  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  return matrix[len1][len2];
}

export function findCommandSuggestion(input: string): string | null {
  const inputLower = input.toLowerCase().trim();

  if (inputLower.length === 0) {
    return null;
  }

  let bestMatch: { command: string; distance: number } | null = null;

  for (const cmd of allCommands) {
    const nameDistance = levenshteinDistance(inputLower, cmd.name);
    const aliasDistance = cmd.alias ? levenshteinDistance(inputLower, cmd.alias) : Infinity;
    const distance = Math.min(nameDistance, aliasDistance);

    if (distance <= 2) {
      if (!bestMatch || distance < bestMatch.distance) {
        bestMatch = { command: cmd.name, distance };
      } else if (distance === bestMatch.distance && cmd.name.length < bestMatch.command.length) {
        bestMatch = { command: cmd.name, distance };
      }
    }
  }

  if (inputLower.startsWith('f') && inputLower.length > 1 && (!bestMatch || bestMatch.distance > 1)) {
    const withoutF = inputLower.substring(1);

    for (const cmd of allCommands) {
      if (cmd.name === 'fire' || cmd.alias === 'f') {
        continue;
      }

      const nameDistance = levenshteinDistance(withoutF, cmd.name);
      const aliasDistance = cmd.alias ? levenshteinDistance(withoutF, cmd.alias) : Infinity;
      const distance = Math.min(nameDistance, aliasDistance);

      if (distance <= 1) {
        if (!bestMatch || distance < bestMatch.distance) {
          bestMatch = { command: cmd.name, distance };
        } else if (distance === bestMatch.distance && cmd.name.length < bestMatch.command.length) {
          bestMatch = { command: cmd.name, distance };
        }
      }
    }
  }

  return bestMatch ? bestMatch.command : null;
}

export function help(_connection: DbConnection, args: string[]): string[] {
  if (args.length === 0) {
    return [
      `  ${themeColors.command("drive")}, ${themeColors.command("d")}             Drive to a direction or coordinate using pathfinding`,
      `  ${themeColors.command("stop")}, ${themeColors.command("s")}              Stop the tank immediately`,
      `  ${themeColors.command("aim")}, ${themeColors.command("a")}               Aim turret at an angle/direction or target a tank by code`,
      `  ${themeColors.command("fire")}, ${themeColors.command("f")}              Fire a projectile from your tank`,
      `  ${themeColors.command("switch")}, ${themeColors.command("w")}            Switch to a different gun`,
      `  ${themeColors.command("respawn")}              Respawn after death`,
      `  ${themeColors.command("tanks")}                Display all tanks in the world with statistics`,
      `  ${themeColors.command("name")}                 View or change your player name`,
      `  ${themeColors.command("create")}               Create a new game world with optional flags`,
      `  ${themeColors.command("join")}                 Join or create a game world (default: random)`,
      `  ${themeColors.command("exit")}, ${themeColors.command("e")}              Return to your homeworld`,
      `  ${themeColors.command("clear")}, ${themeColors.command("c")}             Clear the terminal output`,
      `  ${themeColors.command("help")}, ${themeColors.command("h")}              Display help information`,
    ];
  }

  const command = args[0].toLowerCase();

  switch (command) {
    case "drive":
    case "d":
      return [
        "drive, d - Navigate your tank using pathfinding",
        "",
        "Usage: drive <direction> [distance] [throttle]",
        "",
        "Arguments:",
        "  <direction>    Direction to drive (with pathfinding)",
        "                 Directions:",
        "                   ↑: north, up, n, u",
        "                   ↗: northeast, upright, rightup, ne, ur, ru",
        "                   →: east, right, e, r",
        "                   ↘: southeast, downright, rightdown, se, dr, rd",
        "                   ↓: south, down, s, d",
        "                   ↙: southwest, downleft, leftdown, sw, dl, ld",
        "                   ←: west, left, w, l",
        "                   ↖: northwest, upleft, leftup, nw, ul, lu",
        "  [distance]     Distance to drive in units (default: 1)",
        "  [throttle]     Speed as percentage 1-100 (default: 100)",
        "",
        "Examples:",
        "  drive northeast 5",
        "  drive up 3 75",
        "  drive s 10",
      ];

    case "stop":
    case "s":
      return [
        "stop, s - Stop the tank immediately",
        "",
        "Usage: stop",
        "",
        "Clears path and sets velocity to zero.",
        "",
        "Examples:",
        "  stop",
        "  s",
      ];

    case "aim":
    case "a":
      return [
        "aim, a - Aim turret at an angle/direction or target a tank by code",
        "",
        "Usage: aim <angle|direction>",
        "       aim <target_code>",
        "",
        "Arguments:",
        "  <angle|direction>   Angle in degrees or direction name",
        "                      Angles: 0=east, 90=north, 180=west, 270=south",
        "                      Negative angles are supported",
        "                      Directions:",
        "                        ↑: north, up, n, u",
        "                        ↗: northeast, upright, rightup, ne, ur, ru",
        "                        →: east, right, e, r",
        "                        ↘: southeast, downright, rightdown, se, dr, rd",
        "                        ↓: south, down, s, d",
        "                        ↙: southwest, downleft, leftdown, sw, dl, ld",
        "                        ←: west, left, w, l",
        "                        ↖: northwest, upleft, leftup, nw, ul, lu",
        "  <target_code>       Target code of the tank to track (e.g., a4, h8, z2)",
        "                      Format: one letter + one digit",
        "                      Your turret will automatically follow the target",
        "",
        "Examples:",
        "  aim 90",
        "  aim -45",
        "  aim northeast",
        "  aim a4",
      ];

    case "fire":
    case "f":
      return [
        "fire, f - Fire a projectile",
        "",
        "Usage: fire",
        "",
        "Fires from the gun barrel in the direction the turret is facing.",
        "",
        "Examples:",
        "  fire",
        "  f",
      ];

    case "switch":
    case "w":
      return [
        "switch, w - Switch to a different gun",
        "",
        "Usage: switch <gun_index>",
        "",
        "Arguments:",
        "  <gun_index>   Gun slot number (1, 2, or 3)",
        "",
        "Examples:",
        "  switch 1",
        "  switch 2",
        "  w 3",
      ];

    case "respawn":
      return [
        "respawn - Respawn after death",
        "",
        "Usage: respawn",
        "",
        "Respawns at a new spawn point. Can only be used when dead.",
        "",
        "Examples:",
        "  respawn",
      ];

    case "name":
      return [
        "name - View or change your player name",
        "",
        "Usage: name",
        "       name set <new_name>",
        "",
        "Arguments:",
        "  <new_name>  Your new player name (max 15 characters)",
        "",
        "With no arguments, displays your current name.",
        "With 'set', changes your player name across all tanks and worlds.",
        "Use quotes for names with spaces.",
        "",
        "Examples:",
        "  name",
        "  name set Tank47",
        "  name set 'Tank Commander'",
      ];

    case "create":
      return [
        "create - Create a new game world",
        "",
        "Usage: create [--name <name>] [--passcode <pass>] [--bots <count>] [--duration <mins>] [--width <w>] [--height <h>]",
        "",
        "Flags:",
        "  --name, -n          World name (default: 'New World')",
        "  --passcode, -p      Passcode for private worlds (default: '')",
        "  --bots, -b          Number of AI bots, 0-10 (default: 0)",
        "  --duration, -d      Game duration in minutes, 1-20 (default: 10)",
        "  --width, -w         Map width, 10-200 (default: 50)",
        "  --height, -h        Map height, 10-200 (default: 50)",
        "",
        "All worlds are created as private.",
        "After creation, you'll be automatically joined to the new game.",
        "",
        "Examples:",
        "  create",
        "  create --name 'Battle Arena' --bots 4",
        "  create -n 'My Game' -p secret123 -d 15",
        "  create --width 100 --height 100 --duration 20",
      ];

    case "join":
      return [
        "join - Join or create a game world",
        "",
        "Usage: join [world_id|random] [passcode]",
        "",
        "Arguments:",
        "  [world_id|random]  The 4-letter ID of the world to join, or 'random' (default: random)",
        "  [passcode]         The passcode for private worlds (optional)",
        "",
        "With no arguments or 'random', finds an available public game or creates one.",
        "With a world ID, joins that specific world.",
        "Private worlds require a passcode. Use quotes for passcodes with spaces.",
        "",
        "Examples:",
        "  join              (same as 'join random')",
        "  join random",
        "  join ABCD",
        "  join ABCD mysecretpass",
        "  join ABCD 'my secret pass'",
      ];

    case "exit":
    case "e":
      return [
        "exit, e - Return to your homeworld",
        "",
        "Usage: exit",
        "",
        "Removes your tank from the current game world and places it back",
        "in your personal homeworld.",
        "",
        "Examples:",
        "  exit",
        "  e"
      ];

    case "help":
    case "h":
      return [
        "help, h - Display help information",
        "",
        "Usage: help [command]",
        "",
        "Arguments:",
        "  [command]     Show detailed help for a specific command",
        "",
        "Examples:",
        "  help",
        "  help drive",
        "  h d",
      ];

    case "tanks":
      return [
        "tanks - Display all tanks in the world with statistics",
        "",
        "Usage: tanks",
        "",
        "Shows a table with the following information for each tank:",
        "  - Team: Alliance/team number",
        "  - Name: Tank name",
        "  - Kills: Number of tanks destroyed",
        "  - Deaths: Number of times destroyed",
        "  - K/D: Kill/death ratio",
        "  - Gun: Currently selected gun type",
        "",
        "Tanks are sorted by team first, then by net kills (kills - deaths).",
        "",
        "Examples:",
        "  tanks",
      ];

    default:
      return [
        `help: error: unknown command '${command}'`,
        "",
        "Use 'help' to see available commands.",
      ];
  }
}

export function aim(
  connection: DbConnection,
  worldId: string,
  args: string[]
): string[] {
  if (isPlayerDead(connection, worldId)) {
    return [
      themeColors.error("aim: error: cannot aim while dead"),
      "",
      themeColors.dim("Use 'respawn' to respawn"),
    ];
  }

  if (args.length < 1) {
    return [
      themeColors.error("aim: error: missing required argument"),
      "",
      themeColors.dim("Usage: aim <angle|direction>"),
      themeColors.dim("       aim <target_code>"),
      themeColors.dim("Examples:"),
      themeColors.dim("  aim 45"),
      themeColors.dim("  aim northeast"),
      themeColors.dim("  aim a4"),
    ];
  }

  const input = args[0];
  const inputLower = input.toLowerCase();

  const targetCodePattern = /^[a-z][0-9]$/;
  if (targetCodePattern.test(inputLower)) {
    if (!connection.identity) {
      return [themeColors.error("aim: error: no connection")];
    }

    const myTank = findMyTank(connection, worldId);
    if (!myTank) {
      return [themeColors.error("aim: error: no connection")];
    }

    if (inputLower === myTank.targetCode) {
      return [themeColors.error("aim: error: cannot target your own tank")];
    }

    const allTanks = Array.from(connection.db.tank.iter()).filter(
      (t) => t.worldId === worldId
    );
    const targetTank = allTanks.find((t) => t.targetCode === inputLower);
    if (!targetTank || targetTank.alliance === myTank.alliance) {
      return [themeColors.error(`aim: error: tank with code '${inputLower}' not found`)];
    }

    connection.reducers.aim({
      worldId,
      angleRadians: undefined,
      targetCode: inputLower,
    });

    const tankCodeColored = themeColors.colorize(targetTank.targetCode, 'TANK_CODE');
    const tankName = targetTank.name;

    return [themeColors.success(`Targeting tank ${tankCodeColored} (${tankName})`)];
  }

  if (validDirections.includes(inputLower)) {
    const angleRadians = directionToAngle(inputLower);
    const dirInfo = directionAliases[inputLower];
    const description = themeColors.value(dirInfo.name);

    connection.reducers.aim({ worldId, angleRadians, targetCode: undefined });
    return [themeColors.success("Aiming turret ") + description];
  } else {
    const degrees = Number.parseFloat(input);
    if (Number.isNaN(degrees)) {
      return [
        themeColors.error(`aim: error: invalid value '${args[0]}'`),
        themeColors.dim("Must be a number (degrees), valid direction, or target code (e.g., a4)"),
        themeColors.dim("Valid directions: n/u, ne/ur/ru, e/r, se/dr/rd, s/d, sw/dl/ld, w/l, nw/ul/lu"),
        "",
        themeColors.dim("Usage: aim <angle|direction>"),
        themeColors.dim("       aim <target_code>"),
        themeColors.dim("Examples:"),
        themeColors.dim("  aim 90"),
        themeColors.dim("  aim a4"),
      ];
    }

    const angleRadians = (-degrees * Math.PI) / 180;
    const description = `${degrees}°`;

    connection.reducers.aim({ worldId, angleRadians, targetCode: undefined });
    return [themeColors.success(`Aiming turret to ${description}`)];
  }
}

export function stop(
  connection: DbConnection,
  worldId: string,
  args: string[]
): string[] {
  if (isPlayerDead(connection, worldId)) {
    return [
      themeColors.error("stop: error: cannot stop while dead"),
      "",
      themeColors.dim("Use 'respawn' to respawn"),
    ];
  }

  if (args.length > 0) {
    return [
      themeColors.error("stop: error: stop command takes no arguments"),
      "",
      themeColors.dim("Usage: stop"),
      themeColors.dim("       s"),
    ];
  }

  connection.reducers.stop({ worldId });

  return [themeColors.success("Tank stopped")];
}

export function fire(
  connection: DbConnection,
  worldId: string,
  args: string[]
): string[] {
  if (isPlayerDead(connection, worldId)) {
    return [
      themeColors.error("fire: error: cannot fire while dead"),
      "",
      themeColors.dim("Use 'respawn' to respawn"),
    ];
  }

  if (args.length > 0) {
    return [
      themeColors.error("fire: error: fire command takes no arguments"),
      "",
      themeColors.dim("Usage: fire"),
      themeColors.dim("       f"),
    ];
  }

  connection.reducers.fire({ worldId });

  return [themeColors.success("Projectile fired")];
}

export function respawn(
  connection: DbConnection,
  worldId: string,
  args: string[]
): string[] {
  if (!isPlayerDead(connection, worldId)) {
    return [
      themeColors.error("respawn: error: cannot respawn while alive"),
      "",
      themeColors.dim("You must be dead to respawn"),
    ];
  }

  if (args.length > 0) {
    return [
      themeColors.error("respawn: error: respawn command takes no arguments"),
      "",
      themeColors.dim("Usage: respawn"),
    ];
  }

  connection.reducers.respawn({ worldId });

  return [themeColors.success("Respawning...")];
}

export function switchGun(
  connection: DbConnection,
  worldId: string,
  args: string[]
): string[] {
  if (isPlayerDead(connection, worldId)) {
    return [
      themeColors.error("switch: error: cannot switch guns while dead"),
      "",
      themeColors.dim("Use 'respawn' to respawn"),
    ];
  }

  if (args.length < 1) {
    return [
      themeColors.error("switch: error: missing required argument '<gun_index>'"),
      "",
      themeColors.dim("Usage: switch <gun_index>"),
      themeColors.dim("       switch 1"),
      themeColors.dim("       switch 2"),
      themeColors.dim("       switch 3"),
    ];
  }

  const parsed = Number.parseInt(args[0]);
  if (Number.isNaN(parsed) || parsed < 1 || parsed > 3) {
    return [
      themeColors.error(`switch: error: invalid value '${args[0]}' for '<gun_index>': must be 1, 2, or 3`),
      "",
      themeColors.dim("Usage: switch <gun_index>"),
      themeColors.dim("       switch 1"),
    ];
  }

  const gunIndex = parsed - 1;

  if (!connection.identity) {
    return [themeColors.error("switch: error: no connection")];
  }

  const myTank = findMyTank(connection, worldId);
  if (!myTank) {
    return [themeColors.error("switch: error: tank not found")];
  }

  if (gunIndex >= myTank.guns.length) {
    return [
      themeColors.error(`switch: error: gun slot ${themeColors.value(parsed.toString())} is empty`),
      "",
      themeColors.dim(`You only have ${themeColors.value(myTank.guns.length.toString())} gun${myTank.guns.length !== 1 ? "s" : ""}`),
    ];
  }

  connection.reducers.switchGun({ worldId, gunIndex });

  return [themeColors.success(`Switched to gun ${themeColors.value(parsed.toString())}`)];
}

export function drive(
  connection: DbConnection,
  worldId: string,
  args: string[]
): string[] {
  if (isPlayerDead(connection, worldId)) {
    return [
      themeColors.error("drive: error: cannot drive while dead"),
      "",
      themeColors.dim("Use 'respawn' to respawn"),
    ];
  }

  if (args.length < 1) {
    return [
      themeColors.error("drive: error: missing required arguments"),
      "",
      themeColors.dim("Usage: drive <direction> [distance] [throttle]"),
      themeColors.dim("       drive <relative_x> <relative_y> [throttle]"),
      "",
      themeColors.dim("Examples:"),
      themeColors.dim("  drive northeast 5"),
      themeColors.dim("  drive up 3 75"),
      themeColors.dim("  drive 10 5      (10 units right, 5 units down)"),
    ];
  }

  if (!connection.identity) {
    return [themeColors.error("drive: error: no connection")];
  }

  const myTransform = findMyTankTransform(connection, worldId);

  if (!myTransform) {
    return [themeColors.error("drive: error: no connection")];
  }

  const firstArgLower = args[0].toLowerCase();

  if (validDirections.includes(firstArgLower)) {
    const directionInfo = directionAliases[firstArgLower];

    let distance = 1;
    if (args.length > 1) {
      const parsed = Number.parseInt(args[1]);
      if (Number.isNaN(parsed) || parsed <= 0) {
        return [
          themeColors.error(`drive: error: invalid value '${args[1]}' for '[distance]': must be a positive integer`),
          "",
          themeColors.dim("Usage: drive <direction> [distance] [throttle]"),
          themeColors.dim("       drive northeast 5"),
        ];
      } else {
        distance = parsed;
      }
    }

    let throttle = 1;
    if (args.length > 2) {
      const parsed = Number.parseInt(args[2]);
      if (Number.isNaN(parsed) || parsed < 1 || parsed > 100) {
        return [
          themeColors.error(`drive: error: invalid value '${args[2]}' for '[throttle]': must be an integer between 1 and 100`),
          "",
          themeColors.dim("Usage: drive <direction> [distance] [throttle]"),
          themeColors.dim("       drive northeast 5 75"),
        ];
      } else {
        throttle = parsed / 100;
      }
    }

    const relativeX = directionInfo.x * distance;
    const relativeY = directionInfo.y * distance;

    const targetX = Math.floor(myTransform.positionX) + relativeX;
    const targetY = Math.floor(myTransform.positionY) + relativeY;

    connection.reducers.drive({ worldId, targetX, targetY, throttle });

    const distanceText = themeColors.value(distance.toString());
    const dirName = themeColors.value(directionInfo.name);
    const throttleDisplay = throttle === 1 ? themeColors.success("full") : themeColors.value(`${throttle * 100}%`);
    const explanation = `${distanceText} ${themeColors.success(distance !== 1 ? "units" : "unit")} ${dirName}`;
    return [
      themeColors.success("Driving ") + explanation + themeColors.success(" at ") + throttleDisplay + themeColors.success(" throttle"),
    ];
  }

  return [
    themeColors.error("drive: error: invalid movement command"),
    "",
    themeColors.dim("Usage: drive <direction> [distance] [throttle]"),
    "",
    themeColors.dim("Examples:"),
    themeColors.dim("  drive northeast 5"),
    themeColors.dim("  drive up 3 75"),
  ];
}

export function create(
  connection: DbConnection,
  args: string[]
): string[] {
  const usage = themeColors.dim("Usage: create [--bots <count>] [--duration <mins>] [--width <w>] [--height <h>]");

  const defaults = {
    bots: 0,
    duration: 10,
    width: 50,
    height: 50
  };

  const state = { ...defaults };
  let i = 0;

  while (i < args.length) {
    const arg = args[i];

    if (arg === '--bots' || arg === '-b') {
      if (i + 1 >= args.length) {
        return [
          themeColors.error(`create: error: ${arg} requires a value`),
          "",
          usage
        ];
      }
      const bots = parseInt(args[i + 1]);
      if (isNaN(bots) || bots < 0 || bots > 10) {
        return [
          themeColors.error(`create: error: invalid bot count '${args[i + 1]}', must be between 0 and 10`),
          "",
          usage
        ];
      }
      state.bots = bots;
      i += 2;
    } else if (arg === '--duration' || arg === '-d') {
      if (i + 1 >= args.length) {
        return [
          themeColors.error(`create: error: ${arg} requires a value`),
          "",
          usage
        ];
      }
      const duration = parseInt(args[i + 1]);
      if (isNaN(duration) || duration < 1 || duration > 20) {
        return [
          themeColors.error(`create: error: invalid duration '${args[i + 1]}', must be between 1 and 20 minutes`),
          "",
          usage
        ];
      }
      state.duration = duration;
      i += 2;
    } else if (arg === '--width' || arg === '-w') {
      if (i + 1 >= args.length) {
        return [
          themeColors.error(`create: error: ${arg} requires a value`),
          "",
          usage
        ];
      }
      const width = parseInt(args[i + 1]);
      if (isNaN(width) || width < 10 || width > 200) {
        return [
          themeColors.error(`create: error: invalid width '${args[i + 1]}', must be between 10 and 200`),
          "",
          usage
        ];
      }
      state.width = width;
      i += 2;
    } else if (arg === '--height' || arg === '-h') {
      if (i + 1 >= args.length) {
        return [
          themeColors.error(`create: error: ${arg} requires a value`),
          "",
          usage
        ];
      }
      const height = parseInt(args[i + 1]);
      if (isNaN(height) || height < 10 || height > 200) {
        return [
          themeColors.error(`create: error: invalid height '${args[i + 1]}', must be between 10 and 200`),
          "",
          usage
        ];
      }
      state.height = height;
      i += 2;
    } else {
      return [
        themeColors.error(`create: error: unknown flag '${arg}'`),
        "",
        usage,
        "",
        themeColors.dim("Defaults: bots=0, duration=10, width=50, height=50")
      ];
    }
  }

  const joinCode = `join_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  setPendingJoinCode(joinCode);

  const gameDurationMicros = BigInt(state.duration * 60 * 1000000);
  const visibility = WorldVisibility.Private;

  connection.reducers.createWorld({
    joinCode,
    visibility,
    botCount: state.bots,
    gameDurationMicros,
    width: state.width,
    height: state.height
  });

  return [
    themeColors.success(`Creating private world...`),
    themeColors.dim(`Bots: ${themeColors.value(state.bots.toString())}, Duration: ${themeColors.value(state.duration.toString())} min, Size: ${themeColors.value(`${state.width}x${state.height}`)}`),
    "",
    themeColors.dim("World creation initiated. You'll be automatically joined.")
  ];
}

export function join(
  connection: DbConnection,
  currentWorldId: string,
  args: string[]
): string[] {
  const firstArg = args.length > 0 ? args[0] : "random";
  const isRandom = firstArg.toLowerCase() === "random";
  const worldId = isRandom ? undefined : firstArg;

  const joinCode = `join_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  setPendingJoinCode(joinCode);

  connection.reducers.joinWorld({
    worldId,
    currentWorldId,
    joinCode,
  });

  if (isRandom) {
    const output = [themeColors.success("Finding or creating a game world...")];
    if (args.length === 0) {
      output.unshift("", themeColors.dim("join random"));
    }
    return output;
  }

  return [
    themeColors.success(`Joining world ${themeColors.value(worldId!)}...`),
  ];
}

export function changeName(connection: DbConnection, args: string[]): string[] {
  if (!connection.identity) {
    return [themeColors.error("name: error: no connection")];
  }

  const player = Array.from(connection.db.player.iter()).find((p) =>
    p.identity.isEqual(connection.identity!)
  );

  if (!player) {
    return [themeColors.error("name: error: player not found")];
  }

  if (args.length === 0) {
    const currentName = player.name ?? "not set";
    return [
      `Your current name: ${themeColors.value(currentName)}`,
      "",
      themeColors.dim("To change your name, use: name set <new_name>"),
    ];
  }

  if (args[0].toLowerCase() !== "set") {
    return [
      themeColors.error("name: error: invalid subcommand"),
      "",
      themeColors.dim("Usage: name"),
      themeColors.dim("       name set <new_name>"),
      "",
      themeColors.dim("Use 'name' to view your current name"),
      themeColors.dim("Use 'name set <new_name>' to change your name"),
    ];
  }

  if (args.length < 2) {
    return [
      themeColors.error("name: error: missing required argument '<new_name>'"),
      "",
      themeColors.dim("Usage: name set <new_name>"),
      themeColors.dim("       name set Tank47"),
    ];
  }

  const newName = args.slice(1).join(" ").trim();

  if (newName.length === 0) {
    return [
      themeColors.error("name: error: name cannot be empty or whitespace"),
      "",
      themeColors.dim("Usage: name set <new_name>"),
      themeColors.dim("       name set Tank47"),
    ];
  }

  if (newName.length > 15) {
    return [
      themeColors.error("name: error: name cannot exceed 15 characters"),
      "",
      themeColors.dim(`Your name has ${themeColors.value(newName.length.toString())} characters`),
      "",
      themeColors.dim("Usage: name set <new_name>"),
      themeColors.dim("       name set Tank47"),
    ];
  }

  connection.reducers.changeName({ newName });

  return [themeColors.success(`Name changed to: ${themeColors.value(newName)}`)];
}

export function exitWorld(connection: DbConnection, worldId: string, args: string[]): string[] {
  if (args.length > 0) {
    return [
      themeColors.error("exit: error: exit command takes no arguments"),
      "",
      themeColors.dim("Usage: exit"),
      themeColors.dim("       e")
    ];
  }

  if (!connection.identity) {
    return [themeColors.error("exit: error: no connection")];
  }

  const joinCode = `exit_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  setPendingJoinCode(joinCode);

  connection.reducers.exitWorld({ worldId, joinCode });

  return [
    themeColors.success("Returning to homeworld..."),
  ];
}

export function tanks(connection: DbConnection, worldId: string, args: string[]): string[] {
  if (args.length > 0) {
    return [
      themeColors.error("tanks: error: tanks command takes no arguments"),
      "",
      themeColors.dim("Usage: tanks")
    ];
  }

  if (!connection.identity) {
    return [themeColors.error("tanks: error: no connection")];
  }

  const tanksInWorld = Array.from(connection.db.tank.iter())
    .filter((tank) => tank.worldId === worldId);

  interface CombinedTank {
    id: string;
    name: string;
    alliance: number;
    kills: number;
    deaths: number;
    selectedGunIndex: number;
    guns: Infer<typeof Gun>[];
  }

  const combinedTanks: CombinedTank[] = [];
  for (const tank of tanksInWorld) {
    combinedTanks.push({
      id: tank.id,
      name: tank.name,
      alliance: tank.alliance,
      kills: tank.kills,
      deaths: tank.deaths,
      selectedGunIndex: tank.selectedGunIndex,
      guns: tank.guns,
    });
  }

  if (combinedTanks.length === 0) {
    return [themeColors.dim("No tanks found in this world")];
  }

  combinedTanks.sort((a, b) => {
    if (a.alliance !== b.alliance) {
      return a.alliance - b.alliance;
    }
    const netKillsA = a.kills - a.deaths;
    const netKillsB = b.kills - b.deaths;
    return netKillsB - netKillsA;
  });

  const rows: string[] = [];

  const teamWidth = 4;
  const nameWidth = Math.max(4, ...combinedTanks.map(t => t.name.length));
  const killsWidth = 5;
  const deathsWidth = 6;
  const kdWidth = 6;
  const gunWidth = Math.max(3, ...combinedTanks.map(t => {
    const selectedGun = t.guns.at(t.selectedGunIndex) ?? null;
    const gunName = selectedGun?.gunType.tag ?? "None";
    return gunName.length;
  }));

  const header =
    themeColors.colorize("Team".padEnd(teamWidth), 'HEADER_TEXT') + themeColors.colorize(" | ", 'SEPARATOR') +
    themeColors.colorize("Name".padEnd(nameWidth), 'HEADER_TEXT') + themeColors.colorize(" | ", 'SEPARATOR') +
    themeColors.colorize("Kills".padEnd(killsWidth), 'HEADER_TEXT') + themeColors.colorize(" | ", 'SEPARATOR') +
    themeColors.colorize("Deaths".padEnd(deathsWidth), 'HEADER_TEXT') + themeColors.colorize(" | ", 'SEPARATOR') +
    themeColors.colorize("K/D".padEnd(kdWidth), 'HEADER_TEXT') + themeColors.colorize(" | ", 'SEPARATOR') +
    themeColors.colorize("Gun".padEnd(gunWidth), 'HEADER_TEXT');

  const separatorLength = teamWidth + nameWidth + killsWidth + deathsWidth + kdWidth + gunWidth + 15;
  const separator = themeColors.colorize("-".repeat(separatorLength), 'SEPARATOR');

  rows.push(header);
  rows.push(separator);

  for (const tank of combinedTanks) {
    const kd = tank.deaths === 0
      ? tank.kills.toFixed(2)
      : (tank.kills / tank.deaths).toFixed(2);

    const selectedGun = tank.guns.at(tank.selectedGunIndex) ?? null;
    const gunName = selectedGun?.gunType.tag ?? "None";

    const teamName = tank.alliance === 0 ? "Red" : tank.alliance === 1 ? "Blue" : "Unknown";
    const teamColorKey = tank.alliance === 0 ? 'TEAM_RED' : tank.alliance === 1 ? 'TEAM_BLUE' : 'TEXT_MUTED';

    const teamColored = themeColors.colorize(teamName.padEnd(teamWidth), teamColorKey);
    const nameColored = themeColors.colorize(tank.name.padEnd(nameWidth), 'TEXT_DEFAULT');
    const killsColored = themeColors.colorize(tank.kills.toString().padEnd(killsWidth), 'TEXT_DEFAULT');
    const deathsColored = themeColors.colorize(tank.deaths.toString().padEnd(deathsWidth), 'TEXT_DEFAULT');
    const kdColored = themeColors.colorize(kd.padEnd(kdWidth), 'TEXT_DEFAULT');
    const gunColored = themeColors.colorize(gunName.padEnd(gunWidth), 'VALUE');

    const row =
      teamColored + themeColors.colorize(" | ", 'SEPARATOR') +
      nameColored + themeColors.colorize(" | ", 'SEPARATOR') +
      killsColored + themeColors.colorize(" | ", 'SEPARATOR') +
      deathsColored + themeColors.colorize(" | ", 'SEPARATOR') +
      kdColored + themeColors.colorize(" | ", 'SEPARATOR') +
      gunColored;

    rows.push(row);
  }

  return rows;
}

