import {listen} from "../../../src/event-helper";

function isLinkLike(node) {
    let tagName = node.tagName
    return typeof node.href === "string" &&
        node.href.indexOf('http') === 0 &&
        (tagName === "A" || tagName === "AREA")
}

export const DOM = {
  isLinkLike: isLinkLike,
  listen: listen
}
