import { type DbConnection } from "../../../module_bindings";
import { setPendingJoinCode } from "../../spacetimedb-connection";

function isPlayerDead(connection: DbConnection, worldId: string): boolean {
  if (!connection.identity) {
    return false;
  }
  const allTanks = Array.from(connection.db.tank.iter()).filter(t => t.worldId === worldId);
  const myTank = allTanks.find(t => t.owner.isEqual(connection.identity!));
  return myTank ? myTank.health <= 0 : false;
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
      "  drive, d             Drive to a tank, direction, or coordinate using pathfinding",
      "  reverse, r           Reverse in the direction the tank is facing",
      "  stop, s              Stop the tank immediately",
      "  aim, a               Aim turret at an angle or direction",
      "  target, t            Target another tank by name",
      "  fire, f              Fire a projectile from your tank",
      "  switch, w            Switch to a different gun",
      "  smokescreen, sm      Deploy a smokescreen that disrupts enemy targeting (60s cooldown)",
      "  respawn              Respawn after death",
      "  findgame             Join a game world",
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
        "Usage: drive <tank_name> [throttle]",
        "       drive <direction> [distance] [throttle]",
        "       drive <relative_x> <relative_y> [throttle]",
        "",
        "Arguments:",
        "  <tank_name>    Name of the tank to drive to (e.g., alpha, bravo)",
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
        "  drive alpha",
        "  drive bravo 75",
        "  drive northeast 5",
        "  drive up 3 75",
        "  drive 10 5      (10 units right, 5 units down)",
        "  drive -10 0     (10 units left)",
        "  drive 0 -15 75  (15 units up at 75% throttle)"
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
        "Switches your active gun to the specified slot. Each gun may have",
        "different properties like projectile type, damage, ammo, etc.",
        "",
        "Examples:",
        "  switch 1",
        "  switch 2",
        "  w 3"
      ];

    case "smokescreen":
    case "sm":
      return [
        "smokescreen, sm - Deploy a smokescreen that disrupts enemy targeting",
        "",
        "Usage: smokescreen",
        "",
        "Deploys a smoke cloud at your current position. Tanks that are",
        "targeting other tanks within the smoke cloud will lose their target,",
        "preventing enemies from targeting you while you're in the smoke.",
        "The smoke cloud persists for 5 seconds. This ability has a 60-second cooldown.",
        "",
        "Examples:",
        "  smokescreen",
        "  sm"
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

export function aim(connection: DbConnection, worldId: string, args: string[]): string[] {
  if (isPlayerDead(connection, worldId)) {
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

    const angleRadians = (-degrees * Math.PI) / 180;
    const description = `${degrees}°`;

    connection.reducers.aim({ worldId, angleRadians });
    return [`Aiming turret to ${description}`];
  }
}

export function target(connection: DbConnection, worldId: string, args: string[]): string[] {
  if (isPlayerDead(connection, worldId)) {
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

  const allTanks = Array.from(connection.db.tank.iter()).filter(t => t.worldId === worldId);
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
  if (isPlayerDead(connection, worldId)) {
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
  if (isPlayerDead(connection, worldId)) {
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
  if (isPlayerDead(connection, worldId)) {
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
  if (!isPlayerDead(connection, worldId)) {
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

export function switchGun(connection: DbConnection, worldId: string, args: string[]): string[] {
  if (isPlayerDead(connection, worldId)) {
    return [
      "switch: error: cannot switch guns while dead",
      "",
      "Use 'respawn' to respawn"
    ];
  }

  if (args.length < 1) {
    return [
      "switch: error: missing required argument '<gun_index>'",
      "",
      "Usage: switch <gun_index>",
      "       switch 1",
      "       switch 2",
      "       switch 3"
    ];
  }

  const parsed = Number.parseInt(args[0]);
  if (Number.isNaN(parsed) || parsed < 1 || parsed > 3) {
    return [
      `switch: error: invalid value '${args[0]}' for '<gun_index>': must be 1, 2, or 3`,
      "",
      "Usage: switch <gun_index>",
      "       switch 1"
    ];
  }

  const gunIndex = parsed - 1;

  if (!connection.identity) {
    return ["switch: error: no connection"];
  }

  const myTank = Array.from(connection.db.tank.iter())
    .filter(t => t.worldId === worldId)
    .find(t => t.owner.isEqual(connection.identity!));

  if (!myTank) {
    return ["switch: error: tank not found"];
  }

  if (gunIndex >= myTank.guns.length) {
    return [
      `switch: error: gun slot ${parsed} is empty`,
      "",
      `You only have ${myTank.guns.length} gun${myTank.guns.length !== 1 ? 's' : ''}`
    ];
  }

  connection.reducers.switchGun({ worldId, gunIndex });

  return [
    `Switched to gun ${parsed}`,
  ];
}

export function drive(connection: DbConnection, worldId: string, args: string[]): string[] {
  if (isPlayerDead(connection, worldId)) {
    return [
      "drive: error: cannot drive while dead",
      "",
      "Use 'respawn' to respawn"
    ];
  }

  if (args.length < 1) {
    return [
      "drive: error: missing required arguments",
      "",
      "Usage: drive <tank_name> [throttle]",
      "       drive <direction> [distance] [throttle]",
      "       drive <relative_x> <relative_y> [throttle]",
      "",
      "Examples:",
      "  drive northeast 5",
      "  drive up 3 75",
      "  drive alpha",
      "  drive 10 5      (10 units right, 5 units down)",
    ];
  }

  if (!connection.identity) {
    return ["drive: error: no connection"];
  }

  const allTanks = Array.from(connection.db.tank.iter()).filter(t => t.worldId === worldId);
  const myTank = allTanks.find(t => t.owner.isEqual(connection.identity!));

  if (!myTank) {
    return ["drive: error: no connection"];
  }

  const firstArgLower = args[0].toLowerCase();
  const targetTank = allTanks.find(t => t.name.toLowerCase() === firstArgLower);

  if (targetTank && targetTank.id !== myTank.id) {
    let throttle = 1;
    if (args.length > 1) {
      const parsed = Number.parseInt(args[1]);
      if (Number.isNaN(parsed) || parsed < 1 || parsed > 100) {
        return [
          `drive: error: invalid value '${args[1]}' for '[throttle]': must be an integer between 1 and 100`,
          "",
          "Usage: drive <tank_name> [throttle]",
          "       drive alpha 75"
        ];
      } else {
        throttle = parsed / 100;
      }
    }

    connection.reducers.driveToTank({ worldId, tankName: targetTank.name, throttle });

    return [
      `Driving to tank '${targetTank.name}' at ${throttle === 1 ? "full" : throttle * 100 + "%"} throttle`,
    ];
  }

  if (validDirections.includes(firstArgLower)) {
    const directionInfo = directionAliases[firstArgLower];

    let distance = 1;
    if (args.length > 1) {
      const parsed = Number.parseInt(args[1]);
      if (Number.isNaN(parsed) || parsed <= 0) {
        return [
          `drive: error: invalid value '${args[1]}' for '[distance]': must be a positive integer`,
          "",
          "Usage: drive <direction> [distance] [throttle]",
          "       drive northeast 5"
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
          `drive: error: invalid value '${args[2]}' for '[throttle]': must be an integer between 1 and 100`,
          "",
          "Usage: drive <direction> [distance] [throttle]",
          "       drive northeast 5 75"
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

    const explanation = `${distance} ${distance !== 1 ? "units" : "unit"} ${directionInfo.symbol} ${directionInfo.name}`;
    return [
      `Driving ${explanation} at ${throttle === 1 ? "full" : throttle * 100 + "%"} throttle`,
    ];
  }

  if (args.length < 2) {
    return [
      "drive: error: missing required arguments",
      "",
      "Usage: drive <tank_name> [throttle]",
      "       drive <direction> [distance] [throttle]",
      "       drive <relative_x> <relative_y> [throttle]",
      "",
      "Tank name not found. If you meant coordinates, provide both X and Y:",
      "  drive 10 5      (10 units right, 5 units down)",
      "  drive -10 0     (10 units left)",
      "  drive 0 -15 75  (15 units up at 75% throttle)"
    ];
  }

  const relativeX = Number.parseInt(args[0]);

  if (Number.isNaN(relativeX)) {
    return [
      `drive: error: invalid relative x coordinate '${args[0]}'`,
      "",
      "Relative X coordinate must be an integer (can be negative)",
      "",
      "Usage: drive <relative_x> <relative_y> [throttle]",
      "       drive 10 5"
    ];
  }

  const relativeY = Number.parseInt(args[1]);

  if (Number.isNaN(relativeY)) {
    return [
      `drive: error: invalid relative y coordinate '${args[1]}'`,
      "",
      "Relative Y coordinate must be an integer (can be negative)",
      "",
      "Usage: drive <relative_x> <relative_y> [throttle]",
      "       drive 10 5"
    ];
  }

  const targetX = Math.floor(myTank.positionX) + relativeX;
  const targetY = Math.floor(myTank.positionY) - relativeY;

  let throttle = 1;
  if (args.length > 2) {
    const parsed = Number.parseInt(args[2]);
    if (Number.isNaN(parsed) || parsed < 1 || parsed > 100) {
      return [
        `drive: error: invalid value '${args[2]}' for '[throttle]': must be an integer between 1 and 100`,
        "",
        "Usage: drive <relative_x> <relative_y> [throttle]",
        "       drive 10 5 75"
      ];
    } else {
      throttle = parsed / 100;
    }
  }

  connection.reducers.driveTo({ worldId, targetX, targetY, throttle });

  const relativeStr = `(${relativeX > 0 ? '+' : ''}${relativeX}, ${relativeY > 0 ? '+' : ''}${relativeY})`;
  return [
    `Driving to ${relativeStr} -> ${targetX} ${targetY} at ${throttle === 1 ? "full" : throttle * 100 + "%"} throttle`,
  ];
}

export function smokescreen(connection: DbConnection, worldId: string, args: string[]): string[] {
  if (isPlayerDead(connection, worldId)) {
    return [
      "smokescreen: error: cannot deploy smokescreen while dead",
      "",
      "Use 'respawn' to respawn"
    ];
  }

  if (args.length > 0) {
    return [
      "smokescreen: error: smokescreen command takes no arguments",
      "",
      "Usage: smokescreen",
      "       sm"
    ];
  }

  const allTanks = Array.from(connection.db.tank.iter()).filter(t => t.worldId === worldId);
  const myTank = allTanks.find(t => connection.identity && t.owner.isEqual(connection.identity));
  
  if (myTank) {
    const currentTime = BigInt(Date.now() * 1000);
    const cooldownEnd = myTank.smokescreenCooldownEnd;
    
    if (cooldownEnd > currentTime) {
      const remaining = Number(cooldownEnd - currentTime) / 1_000_000;
      return [
        `smokescreen: error: ability is on cooldown`,
        "",
        `Time remaining: ${Math.ceil(remaining)} seconds`
      ];
    }
  }

  connection.reducers.smokescreen({ worldId });

  return [
    "Deploying smokescreen...",
  ];
}
