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
      return !this.page.isSameDomainUrl(url) && (this.page.isAffiliatableUrl(url) ||
        (this.affiliateUnkownLinks && !this.page.isNAUrl(url)))
    }
    
    this.rewriteLinkUrl = (link) => {
      let origUrl = link.getAttribute('href')
      let newUrl = this.createAffiliateUrl(origUrl)
      link.href = newUrl
      setTimeout(() => link.setAttribute("href", origUrl), 100)
      return newUrl
    }
    
    this.page = config.page
    
    this.click = config.click
    
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
  
  enableClickHandler() {
    this.click.listen(this.clickHandler.bind(this))
  }
  
  clickHandler(link) {
    if (this.shouldRedirect(link.href)) {
      this.rewriteLinkUrl(link)
    }
  }
  
  init() {
    if (this.skimlinksEnabled) {
      this.enableClickHandler()
    }
  }
}
