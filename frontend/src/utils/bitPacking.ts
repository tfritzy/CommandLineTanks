export function getBit(array: Uint8Array, index: number): boolean {
  if (index < 0 || index >= array.length * 8) {
    return false;
  }
  
  const byteIndex = Math.floor(index / 8);
  const bitIndex = index % 8;
  return (array[byteIndex] & (1 << bitIndex)) !== 0;
}

export function byteArrayToBoolArray(byteArray: Uint8Array, length: number): boolean[] {
  const boolArray = new Array<boolean>(length);
  
  for (let i = 0; i < length; i++) {
    boolArray[i] = getBit(byteArray, i);
  }
  
  return boolArray;
}
