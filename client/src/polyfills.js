// Polyfills for modern ES features on older mobile browsers
if (typeof Promise.withResolvers !== 'function') {
  Promise.withResolvers = function () {
    let resolve, reject;
    const promise = new Promise((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve, reject };
  };
}

if (typeof Map.prototype.getOrInsertComputed !== 'function') {
  Map.prototype.getOrInsertComputed = function (key, callbackFunction) {
    if (this.has(key)) {
      return this.get(key);
    }
    const value = callbackFunction(key);
    this.set(key, value);
    return value;
  };
}

if (typeof Map.prototype.getOrInsert !== 'function') {
  Map.prototype.getOrInsert = function (key, defaultValue) {
    if (this.has(key)) {
      return this.get(key);
    }
    this.set(key, defaultValue);
    return defaultValue;
  };
}

if (typeof Object.groupBy !== 'function') {
  Object.groupBy = function (items, callback) {
    const result = Object.create(null);
    let index = 0;
    for (const item of items) {
      const key = callback(item, index++);
      if (key in result) {
        result[key].push(item);
      } else {
        result[key] = [item];
      }
    }
    return result;
  };
}
