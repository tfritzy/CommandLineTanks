import { type DbConnection } from "../../../module_bindings";
import WorldVisibility from "../../../module_bindings/world_visibility_type";
import { setPendingJoinCode } from "../../spacetimedb-connection";
import * as colors from "./colors";

function isPlayerDead(connection: DbConnection, worldId: string): boolean {
  if (!connection.identity) {
    return false;
  }
  const allTanks = Array.from(connection.db.tank.iter()).filter(
    (t) => t.worldId === worldId
  );
  const myTank = allTanks.find((t) => t.owner.isEqual(connection.identity!));
  return myTank ? myTank.health <= 0 : false;
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
  { name: 'target', alias: 't' },
  { name: 'fire', alias: 'f' },
  { name: 'repair', alias: 'rep' }
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
      "Commands:",
      "  drive, d             Drive to a tank, direction, or coordinate using pathfinding",
      "  stop, s              Stop the tank immediately",
      "  aim, a               Aim turret at an angle or direction",
      "  target, t            Target another tank by code",
      "  fire, f              Fire a projectile from your tank",
      "  switch, w            Switch to a different gun",
      "  smoke, sm            Deploy a smokescreen that disrupts enemy targeting",
      "  overdrive, od        Activate overdrive for 25% increased speed for 10 seconds",
      "  repair, rep          Begin repairing your tank to restore health",
      "  respawn              Respawn after death",
      "  name                 View or change your player name",
      "  create               Create a new game world with optional flags",
      "  join                 Join or create a game world (default: random)",
      "  exit, e              Return to your homeworld",
      "  clear, c             Clear the terminal output",
      "  help, h              Display help information",
    ];
  }

  const command = args[0].toLowerCase();

  switch (command) {
    case "drive":
    case "d":
      return [
        "drive, d - Drive to a relative coordinate or tank using pathfinding",
        "",
        "Usage: drive <target_code> [throttle]",
        "       drive <direction> [distance] [throttle]",
        "       drive <relative_x> <relative_y> [throttle]",
        "",
        "Arguments:",
        "  <target_code>  Target code of the tank to drive to",
        "                 Target codes are shown above each tank (e.g., a4, h8, z2)",
        "                 Format: one letter + one digit",
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
        "  <relative_x>   X offset from your position (e.g., -10, 0, +15)",
        "  <relative_y>   Y offset from your position (e.g., -5, 0, +20)",
        "  [throttle]     Speed as percentage 1-100 (default: 100)",
        "",
        "Examples:",
        "  drive a4",
        "  drive h8 75",
        "  drive northeast 5",
        "  drive up 3 75",
        "  drive 10 5      (10 units right, 5 units down)",
        "  drive -10 0     (10 units left)",
        "  drive 0 -15 75  (15 units up at 75% throttle)",
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

    case "target":
    case "t":
      return [
        "target, t - Target another tank by code",
        "",
        "Usage: target <target_code> [lead]",
        "",
        "Arguments:",
        "  <target_code> Target code of the tank to target (required)",
        "                Target codes are shown above each tank (e.g., a4, h8, z2)",
        "                Format: one letter + one digit",
        "  [lead]        Distance in units to lead the target (default: 0)",
        "                Aims ahead of the target based on their body direction",
        "",
        "Examples:",
        "  target a4",
        "  target h8 3",
        "  t z2 5",
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

    case "smoke":
    case "smokescreen":
    case "sm":
      return [
        "smoke, sm - Deploy a smokescreen",
        "",
        "Usage: smoke",
        "",
        "Deploys a smoke cloud that disrupts enemy targeting.",
        "60 second cooldown.",
        "",
        "Examples:",
        "  smoke",
        "  sm",
      ];

    case "overdrive":
    case "od":
      return [
        "overdrive, od - Activate overdrive",
        "",
        "Usage: overdrive",
        "",
        "Increases movement speed by 25% for 10 seconds.",
        "60 second cooldown.",
        "",
        "Examples:",
        "  overdrive",
        "  od",
      ];

    case "repair":
    case "rep":
      return [
        "repair, rep - Repair your tank",
        "",
        "Usage: repair",
        "",
        "Starts repairing your tank, regenerating health over time.",
        "Repair is interrupted if you take damage or issue a movement command.",
        "60 second cooldown.",
        "",
        "Examples:",
        "  repair",
        "  rep",
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
        "",
        "Examples:",
        "  name",
        "  name set Tank47",
        "  name set Viper",
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
        "  --bots, -b          Number of AI bots, must be even, 0-10 (default: 0)",
        "  --duration, -d      Game duration in minutes, 1-20 (default: 10)",
        "  --width, -w         Map width, 1-200 (default: 50)",
        "  --height, -h        Map height, 1-200 (default: 50)",
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
        "Private worlds require a passcode.",
        "",
        "Examples:",
        "  join              (same as 'join random')",
        "  join random",
        "  join abcd",
        "  join abcd mysecretpass",
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
      colors.error("aim: error: cannot aim while dead"),
      "",
      colors.dim("Use 'respawn' to respawn"),
    ];
  }

  if (args.length < 1) {
    return [
      colors.error("aim: error: missing required argument '<angle|direction>'"),
      "",
      colors.dim("Usage: aim <angle|direction>"),
      colors.dim("       aim 45"),
      colors.dim("       aim northeast"),
    ];
  }

  const input = args[0];
  const inputLower = input.toLowerCase();

  if (validDirections.includes(inputLower)) {
    const angleRadians = directionToAngle(inputLower);
    const dirInfo = directionAliases[inputLower];
    const description = `${colors.colorize(dirInfo.symbol, 'DIRECTION_SYMBOL')} ${dirInfo.name}`;

    connection.reducers.aim({ worldId, angleRadians });
    return [colors.success(`Aiming turret to ${description}`)];
  } else {
    const degrees = Number.parseFloat(input);
    if (Number.isNaN(degrees)) {
      return [
        colors.error(`aim: error: invalid value '${args[0]}' for '<angle|direction>'`),
        colors.dim("Must be a number (degrees) or valid direction"),
        colors.dim("Valid directions: n/u, ne/ur/ru, e/r, se/dr/rd, s/d, sw/dl/ld, w/l, nw/ul/lu"),
        "",
        colors.dim("To target a tank by code, use: target <target_code>"),
        "",
        colors.dim("Usage: aim <angle|direction>"),
        colors.dim("       aim 90"),
      ];
    }

    const angleRadians = (-degrees * Math.PI) / 180;
    const description = `${degrees}°`;

    connection.reducers.aim({ worldId, angleRadians });
    return [colors.success(`Aiming turret to ${description}`)];
  }
}

export function target(
  connection: DbConnection,
  worldId: string,
  args: string[]
): string[] {
  if (isPlayerDead(connection, worldId)) {
    return [
      colors.error("target: error: cannot target while dead"),
      "",
      colors.dim("Use 'respawn' to respawn"),
    ];
  }

  if (args.length < 1) {
    return [
      colors.error("target: error: missing required argument '<target_code>'"),
      "",
      colors.dim("Usage: target <target_code> [lead]"),
      colors.dim("       target a4"),
      colors.dim("       target h8 3"),
    ];
  }

  if (!connection.identity) {
    return [colors.error("target: error: no connection")];
  }

  const targetCode = args[0];
  let lead = 0;

  if (args.length > 1) {
    const parsedLead = Number.parseFloat(args[1]);
    if (Number.isNaN(parsedLead)) {
      return [
        colors.error(`target: error: invalid value '${args[1]}' for '[lead]': must be a valid number`),
        "",
        colors.dim("Usage: target <target_code> [lead]"),
        colors.dim("       target a4 3"),
      ];
    }
    lead = parsedLead;
  }

  const allTanks = Array.from(connection.db.tank.iter()).filter(
    (t) => t.worldId === worldId
  );
  const myTank = allTanks.find((t) => t.owner.isEqual(connection.identity!));

  if (!myTank) {
    return [colors.error("target: error: no connection")];
  }

  const targetCodeLower = targetCode.toLowerCase();

  if (targetCodeLower === myTank.targetCode) {
    return [colors.error("target: error: cannot target your own tank")];
  }

  const targetTank = allTanks.find((t) => t.targetCode === targetCodeLower);
  if (!targetTank || targetTank.alliance === myTank.alliance) {
    return [colors.error(`target: error: tank with code '${targetCode}' not found`)];
  }

  connection.reducers.targetTank({
    worldId,
    targetCode: targetCodeLower,
    lead,
  });

  const tankCodeColored = colors.colorize(targetTank.targetCode, 'TANK_CODE');
  const tankName = targetTank.name;

  if (lead > 0) {
    return [
      colors.success(`Targeting tank ${tankCodeColored} (${tankName}) with ${colors.value(lead.toString())} unit${lead !== 1 ? "s" : ""} lead`),
    ];
  } else {
    return [colors.success(`Targeting tank ${tankCodeColored} (${tankName})`)];
  }
}

export function stop(
  connection: DbConnection,
  worldId: string,
  args: string[]
): string[] {
  if (isPlayerDead(connection, worldId)) {
    return [
      colors.error("stop: error: cannot stop while dead"),
      "",
      colors.dim("Use 'respawn' to respawn"),
    ];
  }

  if (args.length > 0) {
    return [
      colors.error("stop: error: stop command takes no arguments"),
      "",
      colors.dim("Usage: stop"),
      colors.dim("       s"),
    ];
  }

  connection.reducers.stop({ worldId });

  return [colors.success("Tank stopped")];
}

export function fire(
  connection: DbConnection,
  worldId: string,
  args: string[]
): string[] {
  if (isPlayerDead(connection, worldId)) {
    return [
      colors.error("fire: error: cannot fire while dead"),
      "",
      colors.dim("Use 'respawn' to respawn"),
    ];
  }

  if (args.length > 0) {
    return [
      colors.error("fire: error: fire command takes no arguments"),
      "",
      colors.dim("Usage: fire"),
      colors.dim("       f"),
    ];
  }

  connection.reducers.fire({ worldId });

  return [colors.success("Firing projectile")];
}

export function respawn(
  connection: DbConnection,
  worldId: string,
  args: string[]
): string[] {
  if (!isPlayerDead(connection, worldId)) {
    return [
      colors.error("respawn: error: cannot respawn while alive"),
      "",
      colors.dim("You must be dead to respawn"),
    ];
  }

  if (args.length > 0) {
    return [
      colors.error("respawn: error: respawn command takes no arguments"),
      "",
      colors.dim("Usage: respawn"),
    ];
  }

  connection.reducers.respawn({ worldId });

  return [colors.success("Respawning...")];
}

export function switchGun(
  connection: DbConnection,
  worldId: string,
  args: string[]
): string[] {
  if (isPlayerDead(connection, worldId)) {
    return [
      colors.error("switch: error: cannot switch guns while dead"),
      "",
      colors.dim("Use 'respawn' to respawn"),
    ];
  }

  if (args.length < 1) {
    return [
      colors.error("switch: error: missing required argument '<gun_index>'"),
      "",
      colors.dim("Usage: switch <gun_index>"),
      colors.dim("       switch 1"),
      colors.dim("       switch 2"),
      colors.dim("       switch 3"),
    ];
  }

  const parsed = Number.parseInt(args[0]);
  if (Number.isNaN(parsed) || parsed < 1 || parsed > 3) {
    return [
      colors.error(`switch: error: invalid value '${args[0]}' for '<gun_index>': must be 1, 2, or 3`),
      "",
      colors.dim("Usage: switch <gun_index>"),
      colors.dim("       switch 1"),
    ];
  }

  const gunIndex = parsed - 1;

  if (!connection.identity) {
    return [colors.error("switch: error: no connection")];
  }

  const myTank = Array.from(connection.db.tank.iter())
    .filter((t) => t.worldId === worldId)
    .find((t) => t.owner.isEqual(connection.identity!));

  if (!myTank) {
    return [colors.error("switch: error: tank not found")];
  }

  if (gunIndex >= myTank.guns.length) {
    return [
      colors.error(`switch: error: gun slot ${colors.value(parsed.toString())} is empty`),
      "",
      colors.dim(`You only have ${colors.value(myTank.guns.length.toString())} gun${myTank.guns.length !== 1 ? "s" : ""}`),
    ];
  }

  connection.reducers.switchGun({ worldId, gunIndex });

  return [colors.success(`Switched to gun ${colors.value(parsed.toString())}`)];
}

export function drive(
  connection: DbConnection,
  worldId: string,
  args: string[]
): string[] {
  if (isPlayerDead(connection, worldId)) {
    return [
      colors.error("drive: error: cannot drive while dead"),
      "",
      colors.dim("Use 'respawn' to respawn"),
    ];
  }

  if (args.length < 1) {
    return [
      colors.error("drive: error: missing required arguments"),
      "",
      colors.dim("Usage: drive <target_code> [throttle]"),
      colors.dim("       drive <direction> [distance] [throttle]"),
      colors.dim("       drive <relative_x> <relative_y> [throttle]"),
      "",
      colors.dim("Examples:"),
      colors.dim("  drive northeast 5"),
      colors.dim("  drive up 3 75"),
      colors.dim("  drive a4"),
      colors.dim("  drive 10 5      (10 units right, 5 units down)"),
    ];
  }

  if (!connection.identity) {
    return [colors.error("drive: error: no connection")];
  }

  const allTanks = Array.from(connection.db.tank.iter()).filter(
    (t) => t.worldId === worldId
  );
  const myTank = allTanks.find((t) => t.owner.isEqual(connection.identity!));

  if (!myTank) {
    return [colors.error("drive: error: no connection")];
  }

  const firstArgLower = args[0].toLowerCase();
  const targetTank = allTanks.find(
    (t) => t.targetCode.toLowerCase() === firstArgLower
  );

  if (targetTank && targetTank.id !== myTank.id) {
    let throttle = 1;
    if (args.length > 1) {
      const parsed = Number.parseInt(args[1]);
      if (Number.isNaN(parsed) || parsed < 1 || parsed > 100) {
        return [
          colors.error(`drive: error: invalid value '${args[1]}' for '[throttle]': must be an integer between 1 and 100`),
          "",
          colors.dim("Usage: drive <target_code> [throttle]"),
          colors.dim("       drive a4 75"),
        ];
      } else {
        throttle = parsed / 100;
      }
    }

    connection.reducers.driveToTank({
      worldId,
      targetCode: targetTank.targetCode,
      throttle,
    });

    const tankCode = colors.colorize(targetTank.targetCode, 'TANK_CODE');
    const throttleDisplay = throttle === 1 ? "full" : colors.value(`${throttle * 100}%`);
    return [
      colors.success(`Driving to tank ${tankCode} (${targetTank.name}) at ${throttleDisplay} throttle`),
    ];
  }

  if (validDirections.includes(firstArgLower)) {
    const directionInfo = directionAliases[firstArgLower];

    let distance = 1;
    if (args.length > 1) {
      const parsed = Number.parseInt(args[1]);
      if (Number.isNaN(parsed) || parsed <= 0) {
        return [
          colors.error(`drive: error: invalid value '${args[1]}' for '[distance]': must be a positive integer`),
          "",
          colors.dim("Usage: drive <direction> [distance] [throttle]"),
          colors.dim("       drive northeast 5"),
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
          colors.error(`drive: error: invalid value '${args[2]}' for '[throttle]': must be an integer between 1 and 100`),
          "",
          colors.dim("Usage: drive <direction> [distance] [throttle]"),
          colors.dim("       drive northeast 5 75"),
        ];
      } else {
        throttle = parsed / 100;
      }
    }

    const relativeX = directionInfo.x * distance;
    const relativeY = directionInfo.y * distance;

    const targetX = Math.floor(myTank.positionX) + relativeX;
    const targetY = Math.floor(myTank.positionY) + relativeY;

    connection.reducers.driveTo({ worldId, targetX, targetY, throttle });

    const distanceText = colors.value(distance.toString());
    const dirSymbol = colors.colorize(directionInfo.symbol, 'DIRECTION_SYMBOL');
    const throttleDisplay = throttle === 1 ? "full" : colors.value(`${throttle * 100}%`);
    const explanation = `${distanceText} ${distance !== 1 ? "units" : "unit"} ${dirSymbol} ${directionInfo.name}`;
    return [
      colors.success(`Driving ${explanation} at ${throttleDisplay} throttle`),
    ];
  }

  if (args.length < 2) {
    return [
      colors.error("drive: error: missing required arguments"),
      "",
      colors.dim("Usage: drive <tank_name> [throttle]"),
      colors.dim("       drive <direction> [distance] [throttle]"),
      colors.dim("       drive <relative_x> <relative_y> [throttle]"),
      "",
      colors.dim("Tank name not found. If you meant coordinates, provide both X and Y:"),
      colors.dim("  drive 10 5      (10 units right, 5 units down)"),
      colors.dim("  drive -10 0     (10 units left)"),
      colors.dim("  drive 0 -15 75  (15 units up at 75% throttle)"),
    ];
  }

  const relativeX = Number.parseInt(args[0]);

  if (Number.isNaN(relativeX)) {
    return [
      colors.error(`drive: error: invalid relative x coordinate '${args[0]}'`),
      "",
      colors.dim("Relative X coordinate must be an integer (can be negative)"),
      "",
      colors.dim("Usage: drive <relative_x> <relative_y> [throttle]"),
      colors.dim("       drive 10 5"),
    ];
  }

  const relativeY = Number.parseInt(args[1]);

  if (Number.isNaN(relativeY)) {
    return [
      colors.error(`drive: error: invalid relative y coordinate '${args[1]}'`),
      "",
      colors.dim("Relative Y coordinate must be an integer (can be negative)"),
      "",
      colors.dim("Usage: drive <relative_x> <relative_y> [throttle]"),
      colors.dim("       drive 10 5"),
    ];
  }

  const targetX = Math.floor(myTank.positionX) + relativeX;
  const targetY = Math.floor(myTank.positionY) - relativeY;

  let throttle = 1;
  if (args.length > 2) {
    const parsed = Number.parseInt(args[2]);
    if (Number.isNaN(parsed) || parsed < 1 || parsed > 100) {
      return [
        colors.error(`drive: error: invalid value '${args[2]}' for '[throttle]': must be an integer between 1 and 100`),
        "",
        colors.dim("Usage: drive <relative_x> <relative_y> [throttle]"),
        colors.dim("       drive 10 5 75"),
      ];
    } else {
      throttle = parsed / 100;
    }
  }

  connection.reducers.driveTo({ worldId, targetX, targetY, throttle });

  const relativeStr = colors.value(`(${relativeX > 0 ? "+" : ""}${relativeX}, ${relativeY > 0 ? "+" : ""}${relativeY})`);
  const targetStr = colors.value(`${targetX} ${targetY}`);
  const throttleDisplay = throttle === 1 ? "full" : colors.value(`${throttle * 100}%`);
  return [
    colors.success(`Driving to ${relativeStr} -> ${targetStr} at ${throttleDisplay} throttle`),
  ];
}

export function smokescreen(
  connection: DbConnection,
  worldId: string,
  args: string[]
): string[] {
  if (isPlayerDead(connection, worldId)) {
    return [
      colors.error("smoke: error: cannot deploy smoke while dead"),
      "",
      colors.dim("Use 'respawn' to respawn"),
    ];
  }

  if (args.length > 0) {
    return [
      colors.error("smoke: error: smoke command takes no arguments"),
      "",
      colors.dim("Usage: smoke"),
      colors.dim("       sm"),
    ];
  }

  const allTanks = Array.from(connection.db.tank.iter()).filter(
    (t) => t.worldId === worldId
  );
  const myTank = allTanks.find(
    (t) => connection.identity && t.owner.isEqual(connection.identity)
  );

  if (myTank) {
    const remainingMicros = myTank.remainingSmokescreenCooldownMicros;

    if (remainingMicros > 0n) {
      const remaining = Number(remainingMicros) / 1_000_000;
      return [
        colors.error("smoke: error: ability is on cooldown"),
        "",
        `Time remaining: ${colors.colorize(Math.ceil(remaining).toString(), 'COOLDOWN')} seconds`,
      ];
    }
  }

  connection.reducers.smoke({ worldId });

  return [colors.success("Deploying smoke...")];
}

export function overdrive(
  connection: DbConnection,
  worldId: string,
  args: string[]
): string[] {
  if (isPlayerDead(connection, worldId)) {
    return [
      colors.error("overdrive: error: cannot activate overdrive while dead"),
      "",
      colors.dim("Use 'respawn' to respawn"),
    ];
  }

  if (args.length > 0) {
    return [
      colors.error("overdrive: error: overdrive command takes no arguments"),
      "",
      colors.dim("Usage: overdrive"),
      colors.dim("       od"),
    ];
  }

  const allTanks = Array.from(connection.db.tank.iter()).filter(
    (t) => t.worldId === worldId
  );
  const myTank = allTanks.find(
    (t) => connection.identity && t.owner.isEqual(connection.identity)
  );

  if (myTank) {
    const remainingMicros = myTank.remainingOverdriveCooldownMicros;

    if (remainingMicros > 0n) {
      const remaining = Number(remainingMicros) / 1_000_000;
      return [
        colors.error("overdrive: error: ability is on cooldown"),
        "",
        `Time remaining: ${colors.colorize(Math.ceil(remaining).toString(), 'COOLDOWN')} seconds`,
      ];
    }
  }

  connection.reducers.overdrive({ worldId });

  return [colors.success(`Activating overdrive! ${colors.value("+25%")} speed for ${colors.value("10")} seconds`)];
}

export function repair(
  connection: DbConnection,
  worldId: string,
  args: string[]
): string[] {
  if (isPlayerDead(connection, worldId)) {
    return [
      colors.error("repair: error: cannot repair while dead"),
      "",
      colors.dim("Use 'respawn' to respawn"),
    ];
  }

  if (args.length > 0) {
    return [
      colors.error("repair: error: repair command takes no arguments"),
      "",
      colors.dim("Usage: repair"),
      colors.dim("       rep"),
    ];
  }

  const allTanks = Array.from(connection.db.tank.iter()).filter(
    (t) => t.worldId === worldId
  );
  const myTank = allTanks.find(
    (t) => connection.identity && t.owner.isEqual(connection.identity)
  );

  if (myTank) {
    if (myTank.health >= myTank.maxHealth) {
      return [
        colors.error("repair: error: tank is already at full health"),
        "",
        `Health: ${colors.colorize(myTank.health.toString(), 'HEALTH')}/${colors.colorize(myTank.maxHealth.toString(), 'HEALTH')}`,
      ];
    }

    const remainingMicros = myTank.remainingRepairCooldownMicros;

    if (remainingMicros > 0n) {
      const remaining = Number(remainingMicros) / 1_000_000;
      return [
        colors.error("repair: error: ability is on cooldown"),
        "",
        `Time remaining: ${colors.colorize(Math.ceil(remaining).toString(), 'COOLDOWN')} seconds`,
      ];
    }
  }

  connection.reducers.repair({ worldId });

  return [colors.success("Repairing... (interrupted by damage or movement)")];
}

export function create(
  connection: DbConnection,
  args: string[]
): string[] {
  const usage = colors.dim("Usage: create [--name <name>] [--passcode <pass>] [--bots <count>] [--duration <mins>] [--width <w>] [--height <h>]");
  
  const defaults = {
    name: 'New World',
    passcode: '',
    bots: 0,
    duration: 10,
    width: 50,
    height: 50
  };

  const state = { ...defaults };
  let i = 0;

  while (i < args.length) {
    const arg = args[i];
    
    if (arg === '--name' || arg === '-n') {
      if (i + 1 >= args.length) {
        return [
          colors.error(`create: error: ${arg} requires a value`),
          "",
          usage
        ];
      }
      const name = args[i + 1].trim();
      if (!name) {
        return [
          colors.error("create: error: world name cannot be empty"),
          "",
          usage
        ];
      }
      state.name = name;
      i += 2;
    } else if (arg === '--passcode' || arg === '-p') {
      if (i + 1 >= args.length) {
        return [
          colors.error(`create: error: ${arg} requires a value`),
          "",
          usage
        ];
      }
      state.passcode = args[i + 1];
      i += 2;
    } else if (arg === '--bots' || arg === '-b') {
      if (i + 1 >= args.length) {
        return [
          colors.error(`create: error: ${arg} requires a value`),
          "",
          usage
        ];
      }
      const bots = parseInt(args[i + 1]);
      if (isNaN(bots) || bots < 0 || bots > 10 || bots % 2 !== 0) {
        return [
          colors.error(`create: error: invalid bot count '${args[i + 1]}', must be an even number between 0 and 10`),
          "",
          usage
        ];
      }
      state.bots = bots;
      i += 2;
    } else if (arg === '--duration' || arg === '-d') {
      if (i + 1 >= args.length) {
        return [
          colors.error(`create: error: ${arg} requires a value`),
          "",
          usage
        ];
      }
      const duration = parseInt(args[i + 1]);
      if (isNaN(duration) || duration < 1 || duration > 20) {
        return [
          colors.error(`create: error: invalid duration '${args[i + 1]}', must be between 1 and 20 minutes`),
          "",
          usage
        ];
      }
      state.duration = duration;
      i += 2;
    } else if (arg === '--width' || arg === '-w') {
      if (i + 1 >= args.length) {
        return [
          colors.error(`create: error: ${arg} requires a value`),
          "",
          usage
        ];
      }
      const width = parseInt(args[i + 1]);
      if (isNaN(width) || width < 1 || width > 200) {
        return [
          colors.error(`create: error: invalid width '${args[i + 1]}', must be between 1 and 200`),
          "",
          usage
        ];
      }
      state.width = width;
      i += 2;
    } else if (arg === '--height' || arg === '-h') {
      if (i + 1 >= args.length) {
        return [
          colors.error(`create: error: ${arg} requires a value`),
          "",
          usage
        ];
      }
      const height = parseInt(args[i + 1]);
      if (isNaN(height) || height < 1 || height > 200) {
        return [
          colors.error(`create: error: invalid height '${args[i + 1]}', must be between 1 and 200`),
          "",
          usage
        ];
      }
      state.height = height;
      i += 2;
    } else {
      return [
        colors.error(`create: error: unknown flag '${arg}'`),
        "",
        usage,
        "",
        colors.dim("Defaults: name='New World', passcode='', bots=0, duration=10, width=50, height=50")
      ];
    }
  }

  const joinCode = `join_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  setPendingJoinCode(joinCode);
  
  const gameDurationMicros = BigInt(state.duration * 60 * 1000000);
  const visibility = WorldVisibility.Private;

  connection.reducers.createWorld({ 
    joinCode,
    worldName: state.name,
    visibility, 
    passcode: state.passcode,
    botCount: state.bots,
    gameDurationMicros,
    width: state.width,
    height: state.height
  });

  return [
    colors.success(`Creating private world "${state.name}"...`),
    colors.dim(`Bots: ${colors.value(state.bots.toString())}, Duration: ${colors.value(state.duration.toString())} min, Size: ${colors.value(`${state.width}x${state.height}`)}`),
    "",
    colors.dim("World creation initiated. You'll be automatically joined.")
  ];
}

export function join(connection: DbConnection, args: string[]): string[] {
  const firstArg = args.length > 0 ? args[0] : "random";
  const isRandom = firstArg.toLowerCase() === "random";
  const worldId = isRandom ? undefined : firstArg;
  const passcode = args.length > 1 ? args.slice(1).join(" ") : "";

  const joinCode = `join_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  setPendingJoinCode(joinCode);

  connection.reducers.joinWorld({
    worldId,
    joinCode,
    passcode,
  });

  if (isRandom) {
    const output = [colors.success("Finding or creating a game world...")];
    if (args.length === 0) {
      output.unshift("", colors.dim("join random"));
    }
    return output;
  }

  return [colors.success(`Joining world ${colors.value(worldId!)}...`)];
}

export function changeName(connection: DbConnection, args: string[]): string[] {
  if (!connection.identity) {
    return [colors.error("name: error: no connection")];
  }

  const player = Array.from(connection.db.player.iter()).find((p) =>
    p.identity.isEqual(connection.identity!)
  );

  if (!player) {
    return [colors.error("name: error: player not found")];
  }

  if (args.length === 0) {
    return [
      `Your current name: ${colors.value(player.name)}`,
      "",
      colors.dim("To change your name, use: name set <new_name>"),
    ];
  }

  if (args[0].toLowerCase() !== "set") {
    return [
      colors.error("name: error: invalid subcommand"),
      "",
      colors.dim("Usage: name"),
      colors.dim("       name set <new_name>"),
      "",
      colors.dim("Use 'name' to view your current name"),
      colors.dim("Use 'name set <new_name>' to change your name"),
    ];
  }

  if (args.length < 2) {
    return [
      colors.error("name: error: missing required argument '<new_name>'"),
      "",
      colors.dim("Usage: name set <new_name>"),
      colors.dim("       name set Tank47"),
    ];
  }

  const newName = args.slice(1).join(" ").trim();

  if (newName.length === 0) {
    return [
      colors.error("name: error: name cannot be empty or whitespace"),
      "",
      colors.dim("Usage: name set <new_name>"),
      colors.dim("       name set Tank47"),
    ];
  }

  if (newName.length > 15) {
    return [
      colors.error("name: error: name cannot exceed 15 characters"),
      "",
      colors.dim(`Your name has ${colors.value(newName.length.toString())} characters`),
      "",
      colors.dim("Usage: name set <new_name>"),
      colors.dim("       name set Tank47"),
    ];
  }

  connection.reducers.changeName({ newName });

  return [colors.success(`Name changed to: ${colors.value(newName)}`)];
}

export function exitWorld(connection: DbConnection, worldId: string, args: string[]): string[] {
  if (args.length > 0) {
    return [
      colors.error("exit: error: exit command takes no arguments"),
      "",
      colors.dim("Usage: exit"),
      colors.dim("       e")
    ];
  }

  if (!connection.identity) {
    return [colors.error("exit: error: no connection")];
  }

  const joinCode = `exit_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  setPendingJoinCode(joinCode);

  connection.reducers.exitWorld({ worldId, joinCode });

  return [
    colors.success("Returning to homeworld..."),
  ];
}

