import {DOM} from "./dom"

export class Skimlinks {
  constructor(config) {
    
    this.createAffiliateUrl = (url) => {
      return url ? "https://" +
          this.redirectingHost +
          "/?url=" + encodeURIComponent(url) + //destination url
          "&xs=1" + //xs=1 means skimlinks
          "&id=" + this.skimId : ""
    }
    
    this.shouldRedirect = (url) => {
      return true
    }
    
    this.rewriteLinkUrl = (link) => {
      let newUrl = this.createAffiliateUrl(link.href)
      link.href = newUrl
      return newUrl
    }
    
    this.setup(this, config || {})
    
    this.handleClick(this.clickHandler.bind(this))
  }
  
  setup(inst, config) {
    inst.redirectingHost = 'go.redirectingat.com' || config.redirectingHost
    inst.affiliateUnkownLinks = true
    inst.skimId = config.skimId
    inst.contextWin = config.contextWin || window
    inst.excludeDomains = config.excludeDomains || []
  }
  
  handleClick(handler) {
      DOM.listen(this.contextWin.document, "click", handler, true)
  }
  
  clickHandler(event) {
    if (DOM.isLinkLike(event.target)) {
        let link = event.target
        if (this.shouldRedirect(link.href)) {
            this.rewriteLinkUrl(link)
        }
    }
    return false
  }
}
