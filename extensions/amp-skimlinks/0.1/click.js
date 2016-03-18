import {DOM} from "./dom"

export class ClickHandler {
  
  constructor(config) {
    let clickHandler = this.singleListener.bind(this)
    DOM.listen(config.contextWin.document, "click", clickHandler, true)
    DOM.listen(config.contextWin.document, "contextmenu", clickHandler, true)
    this.subscribers = new Set()
  }
  
  singleListener(event) {
    if (DOM.isLinkLike(event.target)) {
        let link = event.target
        for (callback of this.subscribers) {
          callback(link)
        }
    }
  }
  
  listen(callback) {
    this.subscribers.add(callback)
  }
  
}
