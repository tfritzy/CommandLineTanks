import {
  TypeBuilder as __TypeBuilder,
  t as __t,
  type AlgebraicTypeType as __AlgebraicTypeType,
  type Infer as __Infer,
} from "spacetimedb";
import TerrainDetailType from "./terrain_detail_type_type";


export default __t.row({
  id: __t.string().primaryKey(),
  worldId: __t.string(),
  positionX: __t.i32(),
  positionY: __t.i32(),
  get type() {
    return TerrainDetailType;
  },
});
