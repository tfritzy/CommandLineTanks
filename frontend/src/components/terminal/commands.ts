import { Vector2, type DbConnection } from "../../../module_bindings";

const directions = {
  north: { x: 0, y: 1 },
  northEast: { x: 1, y: 1 },
  east: { x: 1, y: 0 },
  southeast: { x: 1, y: -1 },
  south: { x: 0, y: -1 },
  southwest: { x: -1, y: -1 },
  west: { x: -1, y: 0 },
  northeast: { x: -1, y: 1 },
};
const validDirections = Object.keys(directions);

export function help(_connection: DbConnection, args: string[]): string[] {
  if (args.length === 0) {
    return [
      "Commands:",
      "  drive       Move your tank in a direction",
      "  clear       Clear the terminal output",
      "  help        Display help information",
    ];
  }

  const command = args[0].toLowerCase();
  
  switch (command) {
    case "drive":
      return [
        "drive - Move your tank in a direction",
        "",
        "Usage: drive <direction> [distance] [throttle] [--append]",
        "",
        "Arguments:",
        "  <direction>   Direction to move (required)",
        `                Valid options: ${validDirections.join(", ")}`,
        "  [distance]    Distance to travel in units (default: 1)",
        "  [throttle]    Speed as percentage 1-100 (default: 100)",
        "",
        "Options:",
        "  --append      Add this movement to existing path instead of replacing",
        "",
        "Examples:",
        "  drive east",
        "  drive north 5",
        "  drive southeast 3 75",
        "  drive west 2 50 --append"
      ];
    
    case "help":
      return [
        "help - Display help information",
        "",
        "Usage: help [command]",
        "",
        "Arguments:",
        "  [command]     Show detailed help for a specific command",
        "",
        "Examples:",
        "  help",
        "  help drive"
      ];
    
    default:
      return [
        `help: error: unknown command '${command}'`,
        "",
        "Use 'help' to see available commands."
      ];
  }
}

export function drive(connection: DbConnection, args: string[]): string[] {
  const append = args.includes("--append");
  args = args.filter(arg => !arg.startsWith('--'))
  
  if (args.length < 1) {
    return [
      "drive: error: missing required argument '<direction>'",
      "",
      "Usage: drive <direction> [distance] [throttle]",
      "       drive east 3 75"
    ];
  }

  var direction = args[0];
  if (!validDirections.includes(direction)) {
    return [
      `drive: error: invalid value '${direction}' for '<direction>'`,
      `Valid options: ${validDirections.join(", ")}`,
      "",
      "Usage: drive <direction> [distance] [throttle]",
      "       drive east 3"
    ];
  }

  const offset = directions[direction as keyof typeof directions];

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
  
  connection.reducers.drive({ offset, throttle, append });

  const explanation =  `${distance} ${distance != 1 ? "units" : "unit"} ${args[0]} at ${throttle == 1 ? "full" : throttle * 100 + "%"} throttle`;
  if (append) {
    return [`Added drive ${explanation} to path`];
  }
  return [
    `Driving ${explanation}`,
  ];
}
