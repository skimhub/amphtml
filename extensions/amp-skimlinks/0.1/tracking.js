import {xhrFor} from '../../../src/xhr';

export class SkimlinksTracking {
    constructor(config) {
        this.setup(this, config || {})
        this.xhr = xhrFor(this.contextWin)
    }
    
    setup(inst, config) {
        inst.skimId = config.skimId
        inst.contextWin = config.contextWin || window
        inst.tracking = true
    }
    
    trackClick() {
        
    }
    
    trackLinks() {
        
    }
    
    trackImpressions() {
        
    }
    
    init() {
        let doc = this.contextWin.document
        doc.addEventListener("readystatechange", function() {
            if (document.readyState === "interactive" || document.readyState === "complete") {
                this.trackLinks()
                this.trackImpressions()
            }
        })
    }
}
