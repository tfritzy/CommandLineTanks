export const LAKE_TILE_CASES = {
  GROUND_FULL: 0b0000,
  
  LAKE_BR: 0b0001,
  LAKE_BL: 0b0010,
  LAKE_TR: 0b0100,
  LAKE_TL: 0b1000,
  
  LAKE_BOTTOM: 0b0011,
  LAKE_RIGHT: 0b0101,
  LAKE_LEFT: 0b1010,
  LAKE_TOP: 0b1100,
  
  LAKE_DIAGONAL_BLTR: 0b0110,
  LAKE_DIAGONAL_TLBR: 0b1001,
  
  LAKE_NOT_TL: 0b0111,
  LAKE_NOT_TR: 0b1011,
  LAKE_NOT_BL: 0b1101,
  LAKE_NOT_BR: 0b1110,
  
  LAKE_FULL: 0b1111,
} as const;

export function getTileCaseFromCorners(
  topLeft: boolean,
  topRight: boolean,
  bottomLeft: boolean,
  bottomRight: boolean
): number {
  return (
    (topLeft ? 0b1000 : 0) |
    (topRight ? 0b0100 : 0) |
    (bottomLeft ? 0b0010 : 0) |
    (bottomRight ? 0b0001 : 0)
  );
}
