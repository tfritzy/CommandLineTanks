import {
  TypeBuilder as __TypeBuilder,
  t as __t,
  type AlgebraicTypeType as __AlgebraicTypeType,
  type Infer as __Infer,
} from "spacetimedb";


export default __t.row({
  id: __t.string().primaryKey(),
  worldId: __t.string(),
  positionX: __t.f32(),
  positionY: __t.f32(),
  collisionRegionX: __t.i32(),
  collisionRegionY: __t.i32(),
  spawnedAt: __t.u64(),
  radius: __t.f32(),
});
