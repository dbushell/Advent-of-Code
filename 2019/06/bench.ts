const proxy = new Proxy<Array<number>>(a.output, {
  get(target, prop) {
    return Reflect.get(target, prop);
  },
  set(target, prop, value) {
    return Reflect.set(target, prop, value);
  },
  deleteProperty(target, prop) {
    return Reflect.deleteProperty(target, prop);
  },
});
