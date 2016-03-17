function mergeObjects() {
  return Object.assign({}, ...arguments)
}

function unique(arr) {
  //TODO this is valid, working ES6, but doesn't work with this version of babel?
  //return [...new Set(arr)]
  return arr.filter((e, i, c) => c.indexOf(e) >= i)
}

function diff(arr, arr2) {
  return arr.filter(e => arr2.indexOf(e) < 0)
}

/* TODO make this support shims */
function arrFilter(arr, func) {
  return Array.prototype.filter.call(arr, func)
}

export const Util = {
  mergeObjects,
  unique,
  diff,
  arrFilter
}
