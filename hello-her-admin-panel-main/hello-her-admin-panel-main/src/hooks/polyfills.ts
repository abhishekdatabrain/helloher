// Utility function for Array.prototype.includes
export function includes<T>(
  array: T[],
  value: T,
  fromIndex: number = 0,
): boolean {
  if (array == null) {
    throw new TypeError('"this" is null or not defined');
  }
  const len = array.length >>> 0;
  if (len === 0) return false;
  let k = Math.max(fromIndex | 0, 0);
  while (k < len) {
    if (array[k] === value) {
      return true;
    }
    k++;
  }
  return false;
}

// Utility function for Object.assign, modifies the target object in place
export function assign<T extends Record<string, any>>(
  target: T,
  ...sources: Partial<T>[]
): void {
  if (target == null) {
    throw new TypeError("Cannot convert undefined or null to object");
  }
  for (const source of sources) {
    if (source != null) {
      for (const key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          // Use a type assertion to ensure the value is not undefined
          const value = source[key] as T[Extract<keyof T, string>];
          target[key] = value;
        }
      }
    }
  }
}

// Utility function for Array.from
export function from<T>(
  arrayLike: any,
  mapFn?: (v: any, k: number) => T,
  thisArg?: any,
): T[] {
  const arr: T[] = [];
  for (let i = 0; i < arrayLike.length; i++) {
    if (mapFn) {
      arr.push(mapFn.call(thisArg, arrayLike[i], i));
    } else {
      arr.push(arrayLike[i]);
    }
  }
  return arr;
}
