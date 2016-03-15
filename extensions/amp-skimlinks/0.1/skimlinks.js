import {DOM} from "./dom"
import {Util} from "./util"
import {parseUrl} from "../../../src/url"
import {xhrFor} from '../../../src/xhr';

function domain(url) {
  return parseUrl(url).hostname
}

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
      return this.affiliateDomains.indexOf(domain(url)) >= 0 ||
        (this.affiliateUnkownLinks && this.nonAffiliateDomain.indexOf(domain(url)) === -1)
    }
    
    this.rewriteLinkUrl = (link) => {
      let origUrl = link.getAttribute('href')
      let newUrl = this.createAffiliateUrl(origUrl)
      link.href = newUrl
      setTimeout(() => link.setAttribute("href", origUrl), 100)
      return newUrl
    }
    
    this.affiliateDomains = []
    this.nonAffiliateDomain = []
        
    this.setup(this, config || {})
    
    this.xhr = xhrFor(this.contextWin)
    
    this.init()
    
  }
  
  setup(inst, config) {
    inst.redirectingHost = 'go.redirectingat.com' || config.redirectingHost
    inst.affiliateUnkownLinks = true
    inst.skimId = config.skimId
    inst.contextWin = config.contextWin || window
    inst.blacklistedDomains = config.excludeDomains || []
    inst.tracking = true
  }
  
  handleClick(handler) {
    DOM.listen(this.contextWin.document, "click", handler, true)
    DOM.listen(this.contextWin.document, "contextmenu", handler, true)
  }
  
  enableClickHandler() {
    this.handleClick(this.clickHandler.bind(this))
  }
  
  beaconRequestData() {
    return {
      pubcode: this.skimId,
      domains: this.getDomainsSet(),
      page: this.contextWin.location.href
    }
  }
  
  callBeacon() {
    let url = "//r.skimresources.com/api/?data=" + encodeURIComponent(JSON.stringify(this.beaconRequestData()))
    this.xhr.fetch_(url,
      {method: 'GET', mode: 'cors', cache: 'no-store'})
        .then(buffer => buffer.json())
        .then(response => 
          this.clasifyDomains(response.merchant_domains)
        )
  }
  
  getDomainsSet() {
    return Util.unique(this.getSupportedLinks().map(url => domain(url)))
  }
  
  getSupportedLinks() {
    let links = this.contextWin.document.querySelectorAll('a[href],area[href]')
    //Cut out pseudo-protocols and data-urls
    return Util.arrFilter(links, link => link.protocol.indexOf('http') === 0)
  }
  
  clasifyDomains(affiliateDomains) {
    this.affiliateDomains = affiliateDomains
    this.nonAffiliateDomain = Util.diff(this.getDomainsSet(), affiliateDomains)
  }
  
  clickHandler(event) {
    if (DOM.isLinkLike(event.target)) {
        let link = event.target
        if (this.shouldRedirect(link.href)) {
          this.rewriteLinkUrl(link)
        }
        if (this.tracking) {
          
        }
    }
    return false
  }
  
  init() {
    this.enableClickHandler()
    this.callBeacon()
  }
  
}
