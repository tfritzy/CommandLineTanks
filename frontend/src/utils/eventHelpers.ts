import { type EventContext } from "../../module_bindings";

export function getEventTimestamp(ctx: EventContext): bigint | undefined {
  if (ctx.event.tag === 'Reducer' && ctx.event.value?.timestamp?.microsSinceUnixEpoch) {
    return ctx.event.value.timestamp.microsSinceUnixEpoch;
  }
  return undefined;
}
