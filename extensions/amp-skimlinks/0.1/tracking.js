import {xhrFor} from '../../../src/xhr';
import {Util} from "./util"
import {parseUrl} from "../../../src/url"
import {skimConst} from "./const"

export class SkimlinksTracking {
    constructor(config) {
        this.page = config.page
        this.click = config.click
        this.loadStart = config.loadStart
        this.setup(this, config || {})
        this.xhr = xhrFor(this.contextWin)
        
        this.init()
    }
    
    setup(inst, config) {
        inst.skimId = config.skimId
        inst.skimlinksSite = config.skimlinksSite
        inst.contextWin = config.contextWin || window
    }
    
    shouldTrackClick(url) {
      // TODO this seems a bit simplistic
      return !this.page.isSameDomainUrl(url) && this.page.isNAUrl(url)
    }
    
    getClickRequest(url) {
      return {
        pubcode: this.skimId,                       // skim ID
        referrer: this.contextWin.location.href,    // page we are on
        pref: this.contextWin.document.referrer,
        site: this.skimlinksSite,
        url: url,                                   // click url
        custom: "",                                 // user custom var (not supported)
        xtz: new Date().getTimezoneOffset(),        // user timezone
        uuid: "",
        slmcid: this.page.slmCampaignId(url) || "",
        product: "1"
      }
    }
    
    trackClick(link) {
      let url = link.href
      if (this.shouldTrackClick(url)) {
        let doc = this.contextWin.document
        let px = doc.createElement("amp-pixel")
        px.setAttribute("src", "//t.skimresources.com/api/?call=track&data=" +
          encodeURIComponent(JSON.stringify(this.getClickRequest(url))) +
          "&rnd=" + Math.random())
        doc.body.appendChild(px)
      }
    }
    
    getTrackingInfo() {
      let skimlinksUrls = this.page.getSupportedLinks()
        .map(link => link.href)
        .filter(url => this.page.isAffiliatableUrl(url))
      return {
          skimlinksUrls,
          slmIds: Util.unique(skimlinksUrls
            .map(url => this.page.slmCampaignId(url))
            .filter(Boolean))
      }
    }
    
    getImpressionRequest(values) {
      let {skimlinksUrls, slmIds} = this.getTrackingInfo()
      return {
        pag: this.contextWin.location.href,       // page we are on
        pub: this.skimId,                         // skim ID
        phr: {},                                  // phrases (skimwords)
        unl: {},                                  // unlinked
        slc: skimlinksUrls.length,                // skimlinks count
        swc: 0,                                   // skimwords count
        ulc: 0,                                   // unlinked count
        jsl: Date.now() - this.loadStart,         // JS load time
        jsf: "",                                  // JS fingerprint
        uc: "",                                   // user custom
        t: 1,                                     // whether or not to store the page impression part
        slmcid: slmIds,                           // slm campaings
        tz: new Date().getTimezoneOffset(),       // user timezone
        pref: this.contextWin.document.referrer,
        guid: values.guid,                        // user cookie
        uuid: "",                                 // unique impression id
        sessid: "",                               // session (not supported)
      }
    }
    
    trackImpression() {
      let tracking = this
      return this.page.fetchBeaconInfo()
        .then(function(response) {
          let fd = new FormData()
          let {guid} = response
          tracking.xhr.fetch_("//t.skimresources.com/api/track.php",
            {method: 'POST',
            mode: 'cors',
            cache: 'no-store',
            headers: {
              "Content-type": "application/x-www-form-urlencoded; charset=UTF-8"
            },
            body: "data=" + JSON.stringify(tracking.getImpressionRequest({guid}))})
        })
    }
    
    // Remove IDs that should never be hardcoded in our links
    cleanUrl(url) {
      let skimUrl = skimConst.redirUrls.indexOf(Util.domain(url)) > -1
      if (skimUrl) {
        let urlObj = this.contextWin.document.createElement('a')
        urlObj.href = url
        let unwanted = ["xguid", "xuuid", "xsessid"]
        let paramsObj = Util.urlSearchParams(parseUrl(url).search)
        let wantedParams = Util.diff(Object.keys(paramsObj), unwanted)
          .map(param => [param, paramsObj[param]].join('='))
        urlObj.search = '?' + wantedParams.join('&')
        url = urlObj.href
      }
      return url
    }
    
    linksTrackingRequest() {
      let tracking = this
      return tracking.page.getSupportedLinks().reduce(function(ret, link) {
        let href = encodeURIComponent(tracking.cleanUrl(link.href))
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
    
    getLinksRequest(values) {
      let {skimlinksUrls, slmIds} = this.getTrackingInfo()
      
      return {
        dl: this.linksTrackingRequest(),
        pag: this.contextWin.location.href,       // page we are on
        pub: this.skimId,                         // skim ID
        guid: values.guid,                        // user cookie
        uuid: "",                                 // unique impression id
        sessid: "",                               // session id (not supported)
        tz: new Date().getTimezoneOffset(),       // user timezone
        slmcid: slmIds,                           // slm campaings
        typ: "l",                                 // type
        hae: Number(Boolean(skimlinksUrls.length))  // has affiliate links
      }
    }
        
    trackLinks() {
      let tracking = this
      return this.page.fetchBeaconInfo().then(function(response) {
        let fd = new FormData()
        let {guid} = response
        tracking.xhr.fetch_("//t.skimresources.com/api/link",
          {method: 'POST',
          mode: 'cors',
          cache: 'no-store',
          headers: {
            "Content-type": "application/x-www-form-urlencoded; charset=UTF-8"
          },
          body: "data=" + JSON.stringify(tracking.getLinksRequest({guid}))})
      })
    }
    
    init() {
        this.click.listen(this.trackClick.bind(this))
        let doc = this.contextWin.document
        let tracking = this
        doc.addEventListener("readystatechange", function() {
            if (doc.readyState === "interactive" || doc.readyState === "complete") {
                tracking.trackImpression()
                tracking.trackLinks()
            }
        })
    }
}
