import {listen} from "../../../src/event-helper";

function isLinkLike(node) {
    let tagName = node.tagName
    return typeof node.href === "string" &&
        node.href.toLowerCase().indexOf('http') === 0 &&
        (tagName === "A" || tagName === "AREA")
}

function scriptToJSON(elem) {
  let json = null
  if (elem &&
    elem.tagName.toLowerCase() === "script" &&
    elem.getAttribute('type').toLowerCase() == 'application/json') {
    try {
      json = JSON.parse(elem.textContent)
    }
    catch(err) {
      console.error('Skimlinks: script could not be ' +
          'parsed. Is it in a valid JSON format?', err)
    }
  }
  return json
}

export const DOM = {
  isLinkLike,
  scriptToJSON,
  listen
}
