import {xhrFor} from '../../../src/xhr';
import {Util} from "./util"
import {parseUrl} from "../../../src/url"

export class SkimlinksTracking {
    constructor(config) {
        this.page = config.page
        this.loadStart = config.loadStart
        this.setup(this, config || {})
        this.xhr = xhrFor(this.contextWin)
        
        this.init()
    }
    
    setup(inst, config) {
        inst.skimId = config.skimId
        inst.contextWin = config.contextWin || window
    }
    
    trackClick() {
      
    }
    
    trackLinks() {
        
    }
    
    linksTrackingRequest() {
      let tracking = this
      return tracking.page.getSupportedLinks().reduce(function(ret, link) {
        let href = link.href
        if (!(href in ret)) {
          ret[href] = {count: 1, ae: Number(tracking.page.isAffiliatableUrl(href))}
        }
        else {
          ret[href].count += 1
        }
        let slmcid = tracking.page.slmCampaignId(href)
        if (slmcid) {
          ret[href].slmcid = slmcid
        }
        return ret
      }, {})
    }
    
    getImpressionRequest() {
      let skimlinksUrls = this.page.getSupportedLinks()
        .map(link => link.href)
        .filter(url => this.page.isAffiliatableUrl(url))
            
      let slmIds = Util.unique(skimlinksUrls
        .map(url => this.page.slmCampaignId(url))
        .filter(Boolean))
      
      return {
        dl: this.linksTrackingRequest(),
        pag: this.contextWin.location.href,       // page we are on
        pub: this.skimId,                         // skim ID
        guid: "",                                 // user cookie
        uuid: "",                                 // unique impression id
        sessid: "",                               // session id
        tz: new Date().getTimezoneOffset(),       // user timezone
        slmcid: slmIds,                           // slm campaings
        typ: "l",                                 // type
        hae: Number(Boolean(skimlinksUrls.length))  // has affiliate links
      }
    }
        
    trackImpressions() {
      let tracking = this
      return this.page.fetchAffiliateInfo().then(function(response) {
        let fd = new FormData()
        tracking.xhr.fetch_("//t.skimresources.com/api/link",
          {method: 'POST',
          mode: 'cors',
          cache: 'no-store',
          headers: {
            "Content-type": "application/x-www-form-urlencoded; charset=UTF-8"
          },
          body: "data=" + JSON.stringify(tracking.getImpressionRequest())})
      })
    }
    
    init() {
        let doc = this.contextWin.document
        let tracking = this
        doc.addEventListener("readystatechange", function() {
            if (document.readyState === "interactive" || document.readyState === "complete") {
                tracking.trackLinks()
                tracking.trackImpressions()
            }
        })
    }
}
