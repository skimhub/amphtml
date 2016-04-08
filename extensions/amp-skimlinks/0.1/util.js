import {parseUrl} from "../../../src/url"

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

function domain(url) {
  return parseUrl(url).hostname
}

function canonical(domain) {
  return domain.replace(/^www\./, "")
}

// TODO replace with https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams when widely supported
function urlSearchParams(searchStr) {
  if (searchStr.charAt(0) === "?") {
    searchStr = searchStr.substr(1)
  }
  return searchStr.split("&").reduce(function(ret, pair) {
    let [name, value] = pair.split('=')
    Object.assign(ret, {[name]: value})
    return ret
  }, {})
}

export const Util = {
  mergeObjects,
  unique,
  diff,
  arrFilter,
  urlSearchParams,
  domain,
  canonical
}
