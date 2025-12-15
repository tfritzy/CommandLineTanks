import { type DbConnection } from "../../../module_bindings";
import { setPendingJoinCode } from "../../spacetimedb-connection";

function isPlayerDead(connection: DbConnection): boolean {
  if (!connection.identity) {
    return false;
  }
  const allTanks = Array.from(connection.db.tank.iter());
  const myTank = allTanks.find(t => t.owner.isEqual(connection.identity!));
  return myTank?.isDead ?? false;
}

const directionAliases: Record<string, { x: number; y: number; name: string; symbol: string }> = {
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

export function help(_connection: DbConnection, args: string[]): string[] {
  if (args.length === 0) {
    return [
      "Commands:",
      "  drive, d, dr    Move your tank in a direction",
      "  reverse, r      Reverse in the direction the tank is facing",
      "  stop, s         Stop the tank immediately",
      "  aim, a          Aim turret at an angle or direction",
      "  target, t       Target another tank by name",
      "  fire, f         Fire a projectile from your tank",
      "  respawn         Respawn after death",
      "  findgame        Join a game world",
      "  clear, c        Clear the terminal output",
      "  help, h         Display help information",
    ];
  }

  const command = args[0].toLowerCase();
  
  switch (command) {
    case "drive":
    case "d":
    case "dr":
      return [
        "drive, d, dr - Move your tank in a direction",
        "",
        "Usage: drive <direction> [distance] [throttle] [--append|-a]",
        "",
        "Arguments:",
        "  <direction>   Direction to move (required)",
        "                Directions:",
        "                  ↑: north, up, n, u",
        "                  ↗: northeast, upright, rightup, ne, ur, ru",
        "                  →: east, right, e, r",
        "                  ↘: southeast, downright, rightdown, se, dr, rd",
        "                  ↓: south, down, s, d",
        "                  ↙: southwest, downleft, leftdown, sw, dl, ld",
        "                  ←: west, left, w, l",
        "                  ↖: northwest, upleft, leftup, nw, ul, lu",
        "  [distance]    Distance to travel in units (default: 1)",
        "  [throttle]    Speed as percentage 1-100 (default: 100)",
        "",
        "Options:",
        "  --append, -a  Add this movement to existing path instead of replacing",
        "",
        "Examples:",
        "  drive east",
        "  d e",
        "  drive north 5",
        "  d n 5",
        "  drive southeast 3 75",
        "  d se 3 75 -a"
      ];
    
    case "reverse":
    case "r":
      return [
        "reverse, r - Reverse in the direction the tank is facing",
        "",
        "Usage: reverse <distance>",
        "",
        "Arguments:",
        "  <distance>    Distance to reverse in units (required)",
        "                Reverses in the -direction of the tank's body rotation",
        "",
        "Examples:",
        "  reverse 3",
        "  r 2"
      ];
    
    case "stop":
    case "s":
      return [
        "stop, s - Stop the tank immediately",
        "",
        "Usage: stop",
        "",
        "Immediately halts the tank's movement by clearing its path and setting",
        "velocity to zero. The tank will stop at its current position.",
        "",
        "Examples:",
        "  stop",
        "  s"
      ];
    
    case "aim":
    case "a":
      return [
        "aim, a - Aim turret at an angle or direction",
        "",
        "Usage: aim <angle|direction>",
        "",
        "Arguments:",
        "  <angle|direction>   Angle in degrees (0-360) or direction name",
        "                      Angles: 0=east, 90=north, 180=west, 270=south",
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
        "  aim northeast"
      ];

    case "target":
    case "t":
      return [
        "target, t - Target another tank by name",
        "",
        "Usage: target <tank_name> [lead]",
        "",
        "Arguments:",
        "  <tank_name>   Name of the tank to target (required)",
        "  [lead]        Distance in units to lead the target (default: 0)",
        "                Aims ahead of the target based on their body direction",
        "",
        "Examples:",
        "  target alpha",
        "  target bravo 3",
        "  t charlie 5"
      ];
    
    case "fire":
    case "f":
      return [
        "fire, f - Fire a projectile from your tank",
        "",
        "Usage: fire",
        "",
        "Fires a projectile from the tip of your tank's gun barrel in the",
        "direction the turret is currently facing.",
        "",
        "Examples:",
        "  fire",
        "  f"
      ];
    
    case "respawn":
      return [
        "respawn - Respawn after death",
        "",
        "Usage: respawn",
        "",
        "Respawns your tank at a new spawn point after being destroyed.",
        "Can only be used when your tank is dead.",
        "",
        "Examples:",
        "  respawn"
      ];
    
    case "findgame":
      return [
        "findgame - Join a game world",
        "",
        "Usage: findgame",
        "",
        "Finds and joins an available game world to place you in a match.",
        "",
        "Examples:",
        "  findgame"
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
        "  h d"
      ];
    
    default:
      return [
        `help: error: unknown command '${command}'`,
        "",
        "Use 'help' to see available commands."
      ];
  }
}

export function drive(connection: DbConnection, worldId: string, args: string[]): string[] {
  if (isPlayerDead(connection)) {
    return [
      "drive: error: cannot drive while dead",
      "",
      "Use 'respawn' to respawn"
    ];
  }

  const recognizedFlags = ["--append", "-a"];
  const unrecognizedFlag = args.find(arg => arg.startsWith('-') && !recognizedFlags.includes(arg));
  
  if (unrecognizedFlag) {
    return [
      `drive: error: unrecognized flag '${unrecognizedFlag}'`,
      "",
      `Valid flags: ${recognizedFlags.join(", ")}`,
      "",
      "Usage: drive <direction> [distance] [throttle] [--append|-a]",
      "       drive east 3 75 --append"
    ];
  }
  
  const append = args.some(arg => arg === "--append" || arg === "-a");
  args = args.filter(arg => !arg.startsWith('-'))
  
  if (args.length < 1) {
    return [
      "drive: error: missing required argument '<direction>'",
      "",
      "Usage: drive <direction> [distance] [throttle]",
      "       drive east 3 75"
    ];
  }

  const direction = args[0].toLowerCase();
  if (!validDirections.includes(direction)) {
    return [
      `drive: error: invalid value '${direction}' for '<direction>'`,
      "Valid directions: n/u, ne/ur/ru, e/r, se/dr/rd, s/d, sw/dl/ld, w/l, nw/ul/lu",
      "Use 'help drive' for full list",
      "",
      "Usage: drive <direction> [distance] [throttle]",
      "       drive east 3"
    ];
  }

  const directionInfo = directionAliases[direction];
  const offset = { x: directionInfo.x, y: directionInfo.y };

  let distance = 1;
  if (args.length > 1) {
    const parsed = Number.parseInt(args[1]);
    if (Number.isNaN(parsed)) {
      return [
        `drive: error: invalid value '${args[1]}' for '[distance]': must be a valid integer`,
        "",
        "Usage: drive <direction> [distance] [throttle]",
        "       drive east 3"
      ];
    } else {
      distance = parsed;
    }
  }
  offset.x *= distance;
  offset.y *= distance;

  let throttle = 1;
  if (args.length > 2) {
    const parsed = Number.parseInt(args[2]);
    if (Number.isNaN(parsed)) {
      return [
        `drive: error: invalid value '${args[2]}' for '[throttle]': must be an integer between 1 and 100`,
        "",
        "Usage: drive <direction> [distance] [throttle]",
        "       drive east 3 75"
      ];
    } else {
      throttle = parsed / 100;
    }
  }
  
  connection.reducers.drive({ worldId, offset, throttle, append });

  const explanation =  `${distance} ${distance != 1 ? "units" : "unit"} ${directionInfo.symbol} ${directionInfo.name} at ${throttle == 1 ? "full" : throttle * 100 + "%"} throttle`;
  if (append) {
    return [`Added drive ${explanation} to path`];
  }
  return [
    `Driving ${explanation}`,
  ];
}

export function aim(connection: DbConnection, worldId: string, args: string[]): string[] {
  if (isPlayerDead(connection)) {
    return [
      "aim: error: cannot aim while dead",
      "",
      "Use 'respawn' to respawn"
    ];
  }

  if (args.length < 1) {
    return [
      "aim: error: missing required argument '<angle|direction>'",
      "",
      "Usage: aim <angle|direction>",
      "       aim 45",
      "       aim northeast"
    ];
  }

  const input = args[0];
  const inputLower = input.toLowerCase();

  if (validDirections.includes(inputLower)) {
    const angleRadians = directionToAngle(inputLower);
    const dirInfo = directionAliases[inputLower];
    const description = `${dirInfo.symbol} ${dirInfo.name}`;
    
    connection.reducers.aim({ worldId, angleRadians });
    return [`Aiming turret to ${description}`];
  } else {
    const degrees = Number.parseFloat(input);
    if (Number.isNaN(degrees)) {
      return [
        `aim: error: invalid value '${args[0]}' for '<angle|direction>'`,
        "Must be a number (degrees) or valid direction",
        "Valid directions: n/u, ne/ur/ru, e/r, se/dr/rd, s/d, sw/dl/ld, w/l, nw/ul/lu",
        "",
        "To target a tank by name, use: target <tank_name>",
        "",
        "Usage: aim <angle|direction>",
        "       aim 90"
      ];
    }
    if (degrees < 0 || degrees > 360) {
      return [
        `aim: error: angle '${degrees}' out of range`,
        "Angle must be between 0 and 360 degrees",
        "",
        "Usage: aim <angle|direction>",
        "       aim 90"
      ];
    }
    
    const angleRadians = (degrees * Math.PI) / 180;
    const description = `${degrees}°`;
    
    connection.reducers.aim({ worldId, angleRadians });
    return [`Aiming turret to ${description}`];
  }
}

export function target(connection: DbConnection, worldId: string, args: string[]): string[] {
  if (isPlayerDead(connection)) {
    return [
      "target: error: cannot target while dead",
      "",
      "Use 'respawn' to respawn"
    ];
  }

  if (args.length < 1) {
    return [
      "target: error: missing required argument '<tank_name>'",
      "",
      "Usage: target <tank_name> [lead]",
      "       target alpha",
      "       target bravo 3"
    ];
  }

  if (!connection.identity) {
    return ["target: error: no connection"];
  }

  const targetName = args[0];
  let lead = 0;

  if (args.length > 1) {
    const parsedLead = Number.parseFloat(args[1]);
    if (Number.isNaN(parsedLead)) {
      return [
        `target: error: invalid value '${args[1]}' for '[lead]': must be a valid number`,
        "",
        "Usage: target <tank_name> [lead]",
        "       target alpha 3"
      ];
    }
    lead = parsedLead;
  }

  const allTanks = Array.from(connection.db.tank.iter());
  const myTank = allTanks.find(t => t.owner.isEqual(connection.identity!));

  if (!myTank) {
    return ["target: error: no connection"];
  }

  const targetNameLower = targetName.toLowerCase();

  if (targetNameLower === myTank.name) {
    return ["target: error: cannot target your own tank"];
  }

  const targetTank = allTanks.find(t => t.name === targetNameLower);
  if (!targetTank) {
    return [`target: error: tank '${targetName}' not found`];
  }

  connection.reducers.targetTank({ worldId, targetName: targetNameLower, lead });

  if (lead > 0) {
    return [`Targeting tank '${targetTank.name}' with ${lead} unit${lead !== 1 ? 's' : ''} lead`];
  } else {
    return [`Targeting tank '${targetTank.name}'`];
  }
}

export function reverse(connection: DbConnection, worldId: string, args: string[]): string[] {
  if (isPlayerDead(connection)) {
    return [
      "reverse: error: cannot reverse while dead",
      "",
      "Use 'respawn' to respawn"
    ];
  }

  if (args.length < 1) {
    return [
      "reverse: error: missing required argument '<distance>'",
      "",
      "Usage: reverse <distance>",
      "       reverse 3"
    ];
  }

  const parsed = Number.parseFloat(args[0]);
  if (Number.isNaN(parsed)) {
    return [
      `reverse: error: invalid value '${args[0]}' for '<distance>': must be a valid number`,
      "",
      "Usage: reverse <distance>",
      "       reverse 3"
    ];
  }

  const distance = parsed;

  connection.reducers.reverse({ worldId, distance });

  return [
    `Reversing ${distance} ${distance != 1 ? "units" : "unit"}`,
  ];
}

export function stop(connection: DbConnection, worldId: string, args: string[]): string[] {
  if (isPlayerDead(connection)) {
    return [
      "stop: error: cannot stop while dead",
      "",
      "Use 'respawn' to respawn"
    ];
  }

  if (args.length > 0) {
    return [
      "stop: error: stop command takes no arguments",
      "",
      "Usage: stop",
      "       s"
    ];
  }

  connection.reducers.stop({ worldId });

  return [
    "Tank stopped",
  ];
}

export function fire(connection: DbConnection, worldId: string, args: string[]): string[] {
  if (isPlayerDead(connection)) {
    return [
      "fire: error: cannot fire while dead",
      "",
      "Use 'respawn' to respawn"
    ];
  }

  if (args.length > 0) {
    return [
      "fire: error: fire command takes no arguments",
      "",
      "Usage: fire",
      "       f"
    ];
  }

  connection.reducers.fire({ worldId });

  return [
    "Firing projectile",
  ];
}

export function respawn(connection: DbConnection, worldId: string, args: string[]): string[] {
  if (!isPlayerDead(connection)) {
    return [
      "respawn: error: cannot respawn while alive",
      "",
      "You must be dead to respawn"
    ];
  }

  if (args.length > 0) {
    return [
      "respawn: error: respawn command takes no arguments",
      "",
      "Usage: respawn"
    ];
  }

  connection.reducers.respawn({ worldId });

  return [
    "Respawning...",
  ];
}

export function findGame(connection: DbConnection, args: string[]): string[] {
  if (args.length > 0) {
    return [
      "findgame: error: findgame command takes no arguments",
      "",
      "Usage: findgame"
    ];
  }

  const joinCode = `join_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  setPendingJoinCode(joinCode);
  connection.reducers.findWorld({ joinCode });

  return [
    "Searching for a game world...",
  ];
}
