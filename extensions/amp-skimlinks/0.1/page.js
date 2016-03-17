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
    
    this.fetchAffiliateInfo()
      .then(function(info) {
        Object.assign(page, info)
      })
  }
  
  fetchDomainsInfo(request) {
    if (this.domainsInfoPromise) return this.domainsInfoPromise
    let url = "//r.skimresources.com/api/?data=" + encodeURIComponent(JSON.stringify(request))
    this.domainsInfoPromise = this.xhr.fetch_(url,
      {method: 'GET', mode: 'cors', cache: 'no-store'})
        .then(response => response.json())
    return this.domainsInfoPromise
  }
  
  fetchAffiliateInfo() {
    let supportedLinks = this.getSupportedLinks()
    return this.fetchDomainsInfo(this.beaconRequestData(Page.prototype.getDomainsSet(supportedLinks)))
      .then(function(response) {
        let affiliateDomains = response.merchant_domains
        return {
          affiliateDomains,
          nonAffiliateDomains: Util.diff(Page.prototype.getDomainsSet(supportedLinks), affiliateDomains)
        }
      })
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
  
  //returns 0 if not an SLM url or a positive number if slm id found
  slmCampaignId(url) {
    let hash = parseUrl(url).hash
    let slmId = 0
    if (hash) {
      let longId = hash.match(/slm-\d{3,}/)
      if (longId && longId.length) {
        numId = Number(longId[0].split('-').pop())
        if (numId) {
          slmId = numId
        }
      }
    }
    return slmId
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
