import {
  t as __t,
} from "spacetimedb";

export default {
  worldId: __t.string(),
  targetX: __t.i32(),
  targetY: __t.i32(),
  throttle: __t.f32(),
};
