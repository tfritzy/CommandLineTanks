import { type DbConnection } from "../../../module_bindings";
import GameVisibility from "../../../module_bindings/game_visibility_type";
import { setPendingJoinCode } from "../../spacetimedb-connection";
import * as themeColors from "../../theme/colors";
import { getTankGuns, type GunSlot } from "../../utils/tankHelpers";

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

function findMyTank(connection: DbConnection, gameId: string) {
  if (!connection.identity) return null;
  for (const tank of connection.db.tank.iter()) {
    if (tank.gameId === gameId && tank.owner.isEqual(connection.identity)) {
      return tank;
    }
  }
  return null;
}

function findMyTankTransform(connection: DbConnection, gameId: string) {
  const tank = findMyTank(connection, gameId);
  if (!tank) return null;
  return connection.db.tankTransform.tankId.find(tank.id);
}

function isPlayerDead(connection: DbConnection, gameId: string): boolean {
  if (!connection.identity) {
    return false;
  }
  const tank = findMyTank(connection, gameId);
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
  { name: 'track', alias: 't' },
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
      `  ${themeColors.command("drive")}, ${themeColors.command("d")}             Drive in a direction or to a destination code`,
      `  ${themeColors.command("track")}, ${themeColors.command("t")}             Track an enemy tank by code for automatic targeting`,
      `  ${themeColors.command("stop")}, ${themeColors.command("s")}              Stop the tank immediately`,
      `  ${themeColors.command("aim")}, ${themeColors.command("a")}               Aim turret at an angle or direction`,
      `  ${themeColors.command("fire")}, ${themeColors.command("f")}              Fire a projectile from your tank`,
      `  ${themeColors.command("switch")}, ${themeColors.command("w")}            Switch to a different gun`,
      `  ${themeColors.command("respawn")}              Respawn after death`,
      `  ${themeColors.command("tanks")}                Display all tanks in the game with statistics`,
      `  ${themeColors.command("say")}                  Send a message to all players in the game`,
      `  ${themeColors.command("name")}                 View or change your player name`,
      `  ${themeColors.command("create")}               Create a new game`,
      `  ${themeColors.command("join")}                 Join a game (default: random)`,
      `  ${themeColors.command("exit")}, ${themeColors.command("e")}              Return to your homegame`,
      `  ${themeColors.command("clear")}, ${themeColors.command("c")}             Clear the terminal output`,
      `  ${themeColors.command("help")}, ${themeColors.command("h")}              Display help information`,
    ];
  }

  const command = args[0].toLowerCase();

  switch (command) {
    case "drive":
    case "d":
      return [
        "drive, d - Navigate your tank using pathfinding or drive to a destination code",
        "",
        "Usage: drive <direction|code>",
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
        "  <code>         Destination code (like a1, z9) to drive to",
        "",
        "Examples:",
        "  d up",
        "  d s",
        "  d a1          # Drive to destination a1",
      ];

    case "track":
    case "t":
      return [
        "track, t - Track an enemy tank by code for automatic targeting",
        "",
        "Usage: track <target_code>",
        "",
        "Arguments:",
        "  <target_code>       Target code of the tank to track (e.g., a4, h8, z2)",
        "                      Format: one letter + one digit",
        "                      Your turret will automatically follow the target",
        "",
        "Examples:",
        "  track a4",
        "  track h8",
        "  t z2",
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
        "aim, a - Aim turret at an angle or direction",
        "",
        "Usage: aim <angle|direction>",
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
        "",
        "Examples:",
        "  aim 90",
        "  aim -45",
        "  aim northeast",
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
        "With 'set', changes your player name across all tanks and games.",
        "Use quotes for names with spaces.",
        "",
        "Examples:",
        "  name",
        "  name set Tank47",
        "  name set 'Tank Commander'",
      ];

    case "create":
      return [
        "create - Create a new game",
        "",
        "Usage: create [--bots <count>] [--duration <mins>] [--width <w>] [--height <h>]",
        "",
        "Flags:",
        "  --bots, -b          Number of AI bots, 0-10 (default: 0)",
        "  --duration, -d      Game duration in minutes, 1-20 (default: 10)",
        "  --width, -w         Map width, 10-200 (default: 50)",
        "  --height, -h        Map height, 10-200 (default: 50)",
        "",
        "All games are created as private.",
        "After creation, you'll be automatically joined to the new game.",
        "",
        "Examples:",
        "  create",
        "  create --bots 4",
        "  create -b 2 -d 15",
        "  create --width 100 --height 100 --duration 20",
      ];

    case "join":
      return [
        "join - Join or create a game",
        "",
        "Usage: join [game_id|random] [passcode]",
        "",
        "Arguments:",
        "  [game_id|random]  The 4-letter ID of the game to join, or 'random' (default: random)",
        "  [passcode]         The passcode for private games (optional)",
        "",
        "With no arguments or 'random', finds an available public game or creates one.",
        "With a game ID, joins that specific game.",
        "Private games require a passcode. Use quotes for passcodes with spaces.",
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
        "exit, e - Return to your homegame",
        "",
        "Usage: exit",
        "",
        "Removes your tank from the current game game and places it back",
        "in your personal homegame.",
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
        "tanks - Display all tanks in the game with statistics",
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

    case "say":
      return [
        "say - Send a message to other players",
        "",
        "Usage: say <message>",
        "",
        "Arguments:",
        "  <message>     Your message (max 200 characters)",
        "",
        "Your message will be visible to all players in the game.",
        "",
        "Examples:",
        "  say Hello everyone!",
        "  say Good game!",
        "  say Watch out north",
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
  gameId: string,
  args: string[]
): string[] {
  if (isPlayerDead(connection, gameId)) {
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
      themeColors.dim("Examples:"),
      themeColors.dim("  aim 45"),
      themeColors.dim("  aim northeast"),
    ];
  }

  const input = args[0];
  const inputLower = input.toLowerCase();

  if (validDirections.includes(inputLower)) {
    const angleRadians = directionToAngle(inputLower);
    const dirInfo = directionAliases[inputLower];
    const description = themeColors.value(dirInfo.name);

    connection.reducers.aim({ gameId, angleRadians });
    return [themeColors.success("Aiming turret ") + description];
  } else {
    const degrees = Number.parseFloat(input);
    if (Number.isNaN(degrees)) {
      return [
        themeColors.error(`aim: error: invalid value '${args[0]}'`),
        themeColors.dim("Must be a number (degrees) or valid direction"),
        themeColors.dim("Valid directions: n/u, ne/ur/ru, e/r, se/dr/rd, s/d, sw/dl/ld, w/l, nw/ul/lu"),
        "",
        themeColors.dim("Usage: aim <angle|direction>"),
        themeColors.dim("Examples:"),
        themeColors.dim("  aim 90"),
        themeColors.dim("  aim northeast"),
      ];
    }

    const angleRadians = (-degrees * Math.PI) / 180;
    const description = `${degrees}°`;

    connection.reducers.aim({ gameId, angleRadians });
    return [themeColors.success(`Aiming turret to ${description}`)];
  }
}

export function track(
  connection: DbConnection,
  gameId: string,
  args: string[]
): string[] {
  if (isPlayerDead(connection, gameId)) {
    return [
      themeColors.error("track: error: cannot track while dead"),
      "",
      themeColors.dim("Use 'respawn' to respawn"),
    ];
  }

  if (args.length < 1) {
    return [
      themeColors.error("track: error: missing required argument"),
      "",
      themeColors.dim("Usage: track <target_code>"),
      themeColors.dim("Examples:"),
      themeColors.dim("  track a4"),
      themeColors.dim("  track h8"),
    ];
  }

  const input = args[0];
  const inputLower = input.toLowerCase();

  const targetCodePattern = /^[a-z][0-9]$/;
  if (!targetCodePattern.test(inputLower)) {
    return [
      themeColors.error(`track: error: invalid target code '${input}'`),
      themeColors.dim("Target code must be one letter followed by one digit (e.g., a4, h8)"),
      "",
      themeColors.dim("Usage: track <target_code>"),
      themeColors.dim("Examples:"),
      themeColors.dim("  track a4"),
    ];
  }

  if (!connection.identity) {
    return [themeColors.error("track: error: no connection")];
  }

  const myTank = findMyTank(connection, gameId);
  if (!myTank) {
    return [themeColors.error("track: error: no connection")];
  }

  if (inputLower === myTank.targetCode) {
    return [themeColors.error("track: error: cannot target your own tank")];
  }

  const allTanks = Array.from(connection.db.tank.iter()).filter(
    (t) => t.gameId === gameId
  );
  const targetTank = allTanks.find((t) => t.targetCode === inputLower);
  if (!targetTank || targetTank.alliance === myTank.alliance) {
    return [themeColors.error(`track: error: tank with code '${inputLower}' not found`)];
  }

  connection.reducers.track({
    gameId,
    targetCode: inputLower,
  });

  const tankCodeColored = themeColors.colorize(targetTank.targetCode, 'TANK_CODE');
  const tankName = targetTank.name;

  return [themeColors.success(`Tracking tank ${tankCodeColored} (${tankName})`)];
}

export function stop(
  connection: DbConnection,
  gameId: string,
  args: string[]
): string[] {
  if (isPlayerDead(connection, gameId)) {
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

  connection.reducers.stop({ gameId });

  return [themeColors.success("Tank stopped")];
}

export function fire(
  connection: DbConnection,
  gameId: string,
  args: string[]
): string[] {
  if (isPlayerDead(connection, gameId)) {
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

  connection.reducers.fire({ gameId });

  return [themeColors.success("Projectile fired")];
}

export function respawn(
  connection: DbConnection,
  gameId: string,
  args: string[]
): string[] {
  if (!isPlayerDead(connection, gameId)) {
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

  connection.reducers.respawn({ gameId });

  return [themeColors.success("Respawning...")];
}

export function switchGun(
  connection: DbConnection,
  gameId: string,
  args: string[]
): string[] {
  if (isPlayerDead(connection, gameId)) {
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

  const myTank = findMyTank(connection, gameId);
  if (!myTank) {
    return [themeColors.error("switch: error: tank not found")];
  }

  const guns = getTankGuns(myTank.id);
  if (gunIndex >= guns.length) {
    return [
      themeColors.error(`switch: error: gun slot ${themeColors.value(parsed.toString())} is empty`),
      "",
      themeColors.dim(`You only have ${themeColors.value(guns.length.toString())} gun${guns.length !== 1 ? "s" : ""}`),
    ];
  }

  connection.reducers.switchGun({ gameId, gunIndex });

  return [themeColors.success(`Switched to gun ${themeColors.value(parsed.toString())}`)];
}

export function drive(
  connection: DbConnection,
  gameId: string,
  args: string[]
): string[] {
  if (isPlayerDead(connection, gameId)) {
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
      themeColors.dim("Usage: drive <direction|code>"),
      "",
      themeColors.dim("Examples:"),
      themeColors.dim("  d ne"),
      themeColors.dim("  d a1"),
    ];
  }

  if (!connection.identity) {
    return [themeColors.error("drive: error: no connection")];
  }

  const myTransform = findMyTankTransform(connection, gameId);

  if (!myTransform) {
    return [themeColors.error("drive: error: no connection")];
  }

  const firstArgLower = args[0].toLowerCase();

  if (validDirections.includes(firstArgLower)) {
    const directionInfo = directionAliases[firstArgLower];

    const relativeX = directionInfo.x * 100;
    const relativeY = directionInfo.y * 100;

    const targetX = Math.floor(myTransform.positionX) + relativeX;
    const targetY = Math.floor(myTransform.positionY) + relativeY;

    connection.reducers.drive({ gameId, targetX, targetY, targetCode: undefined });

    const dirName = themeColors.value(directionInfo.name);
    return [
      themeColors.success("Driving ") + dirName,
    ];
  }

  const codePattern = /^[a-z]\d$/;
  if (codePattern.test(firstArgLower)) {
    connection.reducers.drive({ gameId, targetX: 0, targetY: 0, targetCode: firstArgLower });

    return [
      themeColors.success("Driving to ") + themeColors.value(firstArgLower),
    ];
  }

  return [
    themeColors.error("drive: error: invalid movement command"),
    "",
    themeColors.dim("Usage: drive <direction|code>"),
    "",
    themeColors.dim("Examples:"),
    themeColors.dim("  d ne"),
    themeColors.dim("  d u"),
    themeColors.dim("  d a1          # Drive to destination a1"),
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
  setPendingJoinCode(joinCode, true);

  const gameDurationMicros = BigInt(state.duration * 60 * 1000000);
  const visibility = GameVisibility.Private;

  connection.reducers.createGame({
    joinCode,
    visibility,
    botCount: state.bots,
    gameDurationMicros,
    width: state.width,
    height: state.height
  });

  return [
    themeColors.success(`Creating private game...`),
    themeColors.dim(`Bots: ${themeColors.value(state.bots.toString())}, Duration: ${themeColors.value(state.duration.toString())} min, Size: ${themeColors.value(`${state.width}x${state.height}`)}`),
  ];
}

export function join(
  connection: DbConnection,
  currentGameId: string,
  args: string[]
): string[] {
  const firstArg = args.length > 0 ? args[0] : "random";
  const isRandom = firstArg.toLowerCase() === "random";
  const gameId = isRandom ? undefined : firstArg;

  const joinCode = `join_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  setPendingJoinCode(joinCode);

  connection.reducers.joinGame({
    gameId,
    currentGameId,
    joinCode,
  });

  if (isRandom) {
    const output = [themeColors.success("Finding or creating a game game...")];
    if (args.length === 0) {
      output.unshift("", themeColors.dim("join random"));
    }
    return output;
  }

  return [
    themeColors.success(`Joining game ${themeColors.value(gameId!)}...`),
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

export function exitGame(connection: DbConnection, gameId: string, args: string[]): string[] {
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

  if (gameId.length > 4) {
    if (gameId.startsWith("tutorial_")) {
      return [
        themeColors.error("exit: error: cannot exit from tutorial. Use 'tutorial skip' instead."),
      ];
    }
    return [
      themeColors.error("exit: error: you are already in your homegame"),
    ];
  }

  const joinCode = `exit_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  setPendingJoinCode(joinCode);

  connection.reducers.exitGame({ gameId, joinCode });

  return [
    themeColors.success("Returning to homegame..."),
  ];
}

export function tanks(connection: DbConnection, gameId: string, args: string[]): string[] {
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

  const tanksInGame = Array.from(connection.db.tank.iter())
    .filter((tank) => tank.gameId === gameId);

  interface CombinedTank {
    id: string;
    name: string;
    alliance: number;
    kills: number;
    deaths: number;
    selectedGunIndex: number;
    guns: GunSlot[];
  }

  const combinedTanks: CombinedTank[] = [];
  for (const tank of tanksInGame) {
    const guns = getTankGuns(tank.id);
    combinedTanks.push({
      id: tank.id,
      name: tank.name,
      alliance: tank.alliance,
      kills: tank.kills,
      deaths: tank.deaths,
      selectedGunIndex: tank.selectedGunIndex,
      guns: guns,
    });
  }

  if (combinedTanks.length === 0) {
    return [themeColors.dim("No tanks found in this game")];
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
    const gunName = selectedGun?.gunType ?? "None";
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
    const gunName = selectedGun?.gunType ?? "None";

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

export function tutorial(
  connection: DbConnection,
  gameId: string,
  args: string[]
): string[] {
  if (args.length < 1) {
    return [
      themeColors.error("tutorial: error: missing subcommand"),
      "",
      themeColors.dim("Usage: tutorial complete"),
      themeColors.dim("       tutorial skip"),
    ];
  }

  const subcommand = args[0].toLowerCase();

  const reducers = connection.reducers as {
    tutorialComplete?: (params: { gameId: string; joinCode: string }) => void;
    tutorialSkip?: (params: { gameId: string; joinCode: string }) => void;
  };

  if (subcommand === "complete") {
    if (!reducers.tutorialComplete) {
      return [themeColors.error("tutorial: error: tutorial commands not available")];
    }
    const joinCode = `tutorial_complete_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    setPendingJoinCode(joinCode);
    reducers.tutorialComplete({ gameId, joinCode });
    return [themeColors.success("Completing tutorial...")];
  }

  if (subcommand === "skip") {
    if (!reducers.tutorialSkip) {
      return [themeColors.error("tutorial: error: tutorial commands not available")];
    }
    const joinCode = `tutorial_skip_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    setPendingJoinCode(joinCode);
    reducers.tutorialSkip({ gameId, joinCode });
    return [themeColors.success("Skipping tutorial...")];
  }

  return [
    themeColors.error(`tutorial: error: unknown subcommand '${subcommand}'`),
    "",
    themeColors.dim("Usage: tutorial complete"),
    themeColors.dim("       tutorial skip"),
  ];
}

export function say(
  connection: DbConnection,
  gameId: string,
  args: string[]
): string[] {
  if (args.length < 1) {
    return [
      themeColors.error("say: error: missing message"),
      "",
      themeColors.dim("Usage: say <message>"),
      themeColors.dim("Examples:"),
      themeColors.dim("  say Hello everyone!"),
      themeColors.dim("  say Watch out north"),
    ];
  }

  const message = args.join(" ").trim();

  if (message.length === 0) {
    return [
      themeColors.error("say: error: message cannot be empty"),
      "",
      themeColors.dim("Usage: say <message>"),
    ];
  }

  if (message.length > 200) {
    return [
      themeColors.error("say: error: message too long (max 200 characters)"),
      "",
      themeColors.dim(`Your message has ${themeColors.value(message.length.toString())} characters`),
    ];
  }

  connection.reducers.say({ gameId, message });

  return [themeColors.success("Message sent")];
}

