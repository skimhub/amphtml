function setOrDefault(v, def) {
    return isDefined(v) ? v : def
}

export const Util = {
  isDefined: (v) => typeof v !== "undefined",
  setOrDefault: setOrDefault
}
