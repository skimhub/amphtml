import {Util} from "./util"
import {parseUrl} from "../../../src/url"
import {xhrFor} from '../../../src/xhr';

function domain(url) {
  return parseUrl(url).hostname
}

export class Page {
  
  constructor(config) {
    let page = this
    this.skimId = config.skimId
    this.contextWin = config.contextWin
    this.affiliateDomains = []
    this.nonAffiliateDomains = []
    this.xhr = xhrFor(this.contextWin)

    let supportedLinks = this.getSupportedLinks()    
    this.fetchDomainsInfo(this.beaconRequestData(Page.prototype.getDomainsSet(supportedLinks)))
      .then(function(response) {
        let affiliateDomains = response.merchant_domains
        page.affiliateDomains = affiliateDomains
        page.nonAffiliateDomains = Util.diff(Page.prototype.getDomainsSet(supportedLinks), affiliateDomains)
      })
  }
  
  fetchDomainsInfo(request) {
    let url = "//r.skimresources.com/api/?data=" + encodeURIComponent(JSON.stringify(request))
    return this.xhr.fetch_(url,
      {method: 'GET', mode: 'cors', cache: 'no-store'})
        .then(response => response.json())
      }
  
  beaconRequestData(domains) {
    return {
      pubcode: this.skimId,
      domains: domains,
      page: this.contextWin.location.href
    }
  }
    
  getDomainsSet(links) {
    return Util.unique(links.map(url => domain(url)))
  }
  
  getSupportedLinks() {
    let links = this.contextWin.document.querySelectorAll('a[href],area[href]')
    //Cut out pseudo-protocols and data-urls
    return Util.arrFilter(links, link => link.getAttribute('href').toLowerCase().indexOf('http') === 0)
  }
  
  isAffiliatableUrl(url) {
    return this.affiliateDomains.indexOf(domain(url)) >= 0
  }
  
  isNAUrl(url) {
    return this.nonAffiliateDomains.indexOf(domain(url)) >=0 
  }
  
  isSameDomainUrl(url) {
    return this.contextWin.location.hostname === domain(url)
  }
}
