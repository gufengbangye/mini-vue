export function isObject(value: any): boolean {
  return typeof value === "object" && value != null;
}
export function isFunction(value: any): boolean {
  return typeof value === "function";
}
export function isString(value: any): boolean {
  return typeof value === "string";
}
