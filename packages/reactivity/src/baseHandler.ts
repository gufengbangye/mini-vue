export const baseHandler = {
  get(target: object, key: PropertyKey, receiver: any): any {
    return Reflect.get(target, key, receiver);
  },
  set(target: object, key: PropertyKey, value: any, receiver: any): boolean {
    return Reflect.set(target, key, value, receiver);
  },
};

export const reactiveFlagType = {
  IS_REACTIVE: "__v_isReactive",
};
