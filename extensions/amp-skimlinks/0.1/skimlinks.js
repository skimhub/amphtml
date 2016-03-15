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
      //Url is affiliatable or unknown
      return !this.isSameDomainUrl(url) && (this.isAffiliatableUrl(url) ||
        (this.affiliateUnkownLinks && !this.isNAUrl(url)))
    }
    
    this.rewriteLinkUrl = (link) => {
      let origUrl = link.getAttribute('href')
      let newUrl = this.createAffiliateUrl(origUrl)
      link.href = newUrl
      setTimeout(() => link.setAttribute("href", origUrl), 100)
      return newUrl
    }
    
    this.page = config.page
    
    this.setup(this, config || {})
    
    this.init()
    
  }
  
  setup(inst, config) {
    inst.skimlinksEnabled = true
    inst.redirectingHost = 'go.redirectingat.com' || config.redirectingHost
    inst.affiliateUnkownLinks = true
    inst.skimId = config.skimId
    inst.contextWin = config.contextWin || window
    inst.blacklistedDomains = config.excludeDomains || []
  }
  
  handleClick(handler) {
    DOM.listen(this.contextWin.document, "click", handler, true)
    DOM.listen(this.contextWin.document, "contextmenu", handler, true)
  }
  
  enableClickHandler() {
    this.handleClick(this.clickHandler.bind(this))
  }
  
  isAffiliatableUrl(url) {
    return this.page.isAffiliatableUrl(url)
  }
  
  isNAUrl(url) {
    return this.page.isNAUrl(url)
  }
  
  isSameDomainUrl(url) {
    return this.page.isSameDomainUrl(url)
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
  
  init() {
    if (this.skimlinksEnabled) {
      this.enableClickHandler()
    }
  }
}
