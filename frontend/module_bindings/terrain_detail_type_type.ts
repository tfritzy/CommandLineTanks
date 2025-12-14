import {
  TypeBuilder as __TypeBuilder,
  t as __t,
  type AlgebraicTypeType as __AlgebraicTypeType,
  type Infer as __Infer,
} from "spacetimedb";

const TerrainDetailType = __t.enum("TerrainDetailType", {None: __t.unit(),
  Cliff: __t.unit(),
  Rock: __t.unit(),
  Tree: __t.unit(),
  Bridge: __t.unit(),
  Fence: __t.unit(),
  HayBale: __t.unit(),
  Field: __t.unit(),
});

export default TerrainDetailType;
