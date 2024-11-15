export class Dep {
  private map: Map<any, any>;
  public cleanup: () => void;
  public name: PropertyKey;

  constructor(cleanup: () => void, key: PropertyKey) {
    this.map = new Map();
    this.cleanup = cleanup;
    this.name = key;
  }

  get size() {
    return this.map.size;
  }

  set(key: any, value: any) {
    this.map.set(key, value);
  }
  delete(key: any) {
    this.map.delete(key);
  }

  get(key: any) {
    return this.map.get(key);
  }

  keys() {
    return this.map.keys();
  }
}
export function createDep(cleanup: () => void, key: PropertyKey): Dep {
  return new Dep(cleanup, key);
}
