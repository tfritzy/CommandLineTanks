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
      "  stop, s              Stop the tank immediately",
      "  aim, a               Aim turret at an angle or direction",
      "  target, t            Target another tank by code",
      "  fire, f              Fire a projectile from your tank",
      "  switch, w            Switch to a different gun",
      "  smoke, sm            Deploy a smokescreen that disrupts enemy targeting",
      "  overdrive, od        Activate overdrive for 25% increased speed for 10 seconds",
      "  repair, rep          Begin repairing your tank to restore health",
      "  respawn              Respawn after death",
      "  create               Create a new game world",
      "  join                 Join or create a game world",
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
        "  drive 0 -15 75  (15 units up at 75% throttle)"
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
        "  t z2 5"
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
        "Examples:",
        "  switch 1",
        "  switch 2",
        "  w 3"
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
        "  sm"
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
        "  od"
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
        "  rep"
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
        "  respawn"
      ];

    case "create":
      return [
        "create - Create a new game world",
        "",
        "Usage: create",
        "",
        "Opens an interactive flow to create a new game world.",
        "You can customize world name, visibility (public/private),",
        "passcode, bot count, and game duration.",
        "After creation, you'll be automatically joined to the new game.",
        "",
        "Examples:",
        "  create"
      ];

    case "join":
      return [
        "join - Join or create a game world",
        "",
        "Usage: join [world_id] [passcode]",
        "",
        "Arguments:",
        "  [world_id]  The 4-letter ID of the world to join (optional)",
        "  [passcode]  The passcode for private worlds (optional)",
        "",
        "With no arguments, finds an available public game or creates one.",
        "With a world ID, joins that specific world.",
        "Private worlds require a passcode.",
        "",
        "Examples:",
        "  join",
        "  join abcd",
        "  join abcd mysecretpass"
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
        "To target a tank by code, use: target <target_code>",
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
      "target: error: missing required argument '<target_code>'",
      "",
      "Usage: target <target_code> [lead]",
      "       target a4",
      "       target h8 3"
    ];
  }

  if (!connection.identity) {
    return ["target: error: no connection"];
  }

  const targetCode = args[0];
  let lead = 0;

  if (args.length > 1) {
    const parsedLead = Number.parseFloat(args[1]);
    if (Number.isNaN(parsedLead)) {
      return [
        `target: error: invalid value '${args[1]}' for '[lead]': must be a valid number`,
        "",
        "Usage: target <target_code> [lead]",
        "       target a4 3"
      ];
    }
    lead = parsedLead;
  }

  const allTanks = Array.from(connection.db.tank.iter()).filter(t => t.worldId === worldId);
  const myTank = allTanks.find(t => t.owner.isEqual(connection.identity!));

  if (!myTank) {
    return ["target: error: no connection"];
  }

  const targetCodeLower = targetCode.toLowerCase();

  if (targetCodeLower === myTank.targetCode) {
    return ["target: error: cannot target your own tank"];
  }

  const targetTank = allTanks.find(t => t.targetCode === targetCodeLower);
  if (!targetTank) {
    return [`target: error: tank with code '${targetCode}' not found`];
  }

  connection.reducers.targetTank({ worldId, targetCode: targetCodeLower, lead });

  if (lead > 0) {
    return [`Targeting tank '${targetTank.targetCode}' (${targetTank.name}) with ${lead} unit${lead !== 1 ? 's' : ''} lead`];
  } else {
    return [`Targeting tank '${targetTank.targetCode}' (${targetTank.name})`];
  }
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
      "Usage: drive <target_code> [throttle]",
      "       drive <direction> [distance] [throttle]",
      "       drive <relative_x> <relative_y> [throttle]",
      "",
      "Examples:",
      "  drive northeast 5",
      "  drive up 3 75",
      "  drive a4",
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
  const targetTank = allTanks.find(t => t.targetCode.toLowerCase() === firstArgLower);

  if (targetTank && targetTank.id !== myTank.id) {
    let throttle = 1;
    if (args.length > 1) {
      const parsed = Number.parseInt(args[1]);
      if (Number.isNaN(parsed) || parsed < 1 || parsed > 100) {
        return [
          `drive: error: invalid value '${args[1]}' for '[throttle]': must be an integer between 1 and 100`,
          "",
          "Usage: drive <target_code> [throttle]",
          "       drive a4 75"
        ];
      } else {
        throttle = parsed / 100;
      }
    }

    connection.reducers.driveToTank({ worldId, targetCode: targetTank.targetCode, throttle });

    return [
      `Driving to tank '${targetTank.targetCode}' (${targetTank.name}) at ${throttle === 1 ? "full" : throttle * 100 + "%"} throttle`,
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
      "smoke: error: cannot deploy smoke while dead",
      "",
      "Use 'respawn' to respawn"
    ];
  }

  if (args.length > 0) {
    return [
      "smoke: error: smoke command takes no arguments",
      "",
      "Usage: smoke",
      "       sm"
    ];
  }

  const allTanks = Array.from(connection.db.tank.iter()).filter(t => t.worldId === worldId);
  const myTank = allTanks.find(t => connection.identity && t.owner.isEqual(connection.identity));
  
  if (myTank) {
    const remainingMicros = myTank.remainingSmokescreenCooldownMicros;
    
    if (remainingMicros > 0n) {
      const remaining = Number(remainingMicros) / 1_000_000;
      return [
        `smoke: error: ability is on cooldown`,
        "",
        `Time remaining: ${Math.ceil(remaining)} seconds`
      ];
    }
  }

  connection.reducers.smoke({ worldId });

  return [
    "Deploying smoke...",
  ];
}

export function overdrive(connection: DbConnection, worldId: string, args: string[]): string[] {
  if (isPlayerDead(connection, worldId)) {
    return [
      "overdrive: error: cannot activate overdrive while dead",
      "",
      "Use 'respawn' to respawn"
    ];
  }

  if (args.length > 0) {
    return [
      "overdrive: error: overdrive command takes no arguments",
      "",
      "Usage: overdrive",
      "       od"
    ];
  }

  const allTanks = Array.from(connection.db.tank.iter()).filter(t => t.worldId === worldId);
  const myTank = allTanks.find(t => connection.identity && t.owner.isEqual(connection.identity));
  
  if (myTank) {
    const remainingMicros = myTank.remainingOverdriveCooldownMicros;
    
    if (remainingMicros > 0n) {
      const remaining = Number(remainingMicros) / 1_000_000;
      return [
        `overdrive: error: ability is on cooldown`,
        "",
        `Time remaining: ${Math.ceil(remaining)} seconds`
      ];
    }
  }

  connection.reducers.overdrive({ worldId });

  return [
    "Activating overdrive! +25% speed for 10 seconds",
  ];
}

export function repair(connection: DbConnection, worldId: string, args: string[]): string[] {
  if (isPlayerDead(connection, worldId)) {
    return [
      "repair: error: cannot repair while dead",
      "",
      "Use 'respawn' to respawn"
    ];
  }

  if (args.length > 0) {
    return [
      "repair: error: repair command takes no arguments",
      "",
      "Usage: repair",
      "       rep"
    ];
  }

  const allTanks = Array.from(connection.db.tank.iter()).filter(t => t.worldId === worldId);
  const myTank = allTanks.find(t => connection.identity && t.owner.isEqual(connection.identity));
  
  if (myTank) {
    if (myTank.health >= myTank.maxHealth) {
      return [
        "repair: error: tank is already at full health",
        "",
        `Health: ${myTank.health}/${myTank.maxHealth}`
      ];
    }

    const remainingMicros = myTank.remainingRepairCooldownMicros;
    
    if (remainingMicros > 0n) {
      const remaining = Number(remainingMicros) / 1_000_000;
      return [
        `repair: error: ability is on cooldown`,
        "",
        `Time remaining: ${Math.ceil(remaining)} seconds`
      ];
    }
  }

  connection.reducers.repair({ worldId });

  return [
    "Repairing... (interrupted by damage or movement)",
  ];
}

export function create(_connection: DbConnection, args: string[]): string[] | { type: 'open_flow' } {
  if (args.length > 0) {
    return [
      "create: error: create command takes no arguments",
      "",
      "Usage: create"
    ];
  }

  return { type: 'open_flow' };
}

export function join(connection: DbConnection, args: string[]): string[] {
  const worldId = args.length > 0 ? args[0] : null;
  const passcode = args.length > 1 ? args.slice(1).join(' ') : '';

  const joinCode = `join_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  setPendingJoinCode(joinCode);
  
  connection.reducers.joinWorld({ 
    worldId, 
    joinCode,
    passcode 
  });

  if (!worldId) {
    return [
      "Finding or creating a game world...",
    ];
  }

  return [
    `Joining world ${worldId}...`,
  ];
}

