import {toggle} from '../../../src/style'
import {ClickHandler} from './click'
import {Skimlinks} from './skimlinks'
import {Page} from './page'
import {SkimlinksTracking} from './tracking'

const loadStart = Date.now()
export class AmpSkimlinks extends AMP.BaseElement {
  
  createdCallback() {
    
    const truthMap = {
      "1": true,
      "true": true,
      "0": false,
      "false": false
    }
    
    const skimId = AMP.assert(this.element.getAttribute('data-skim-id'),
      'The data-skim-id attribute is required for <amp-skimlinks> %s',
      this.element)
    
    const skimlinksSite = AMP.assert(this.element.getAttribute('data-site-name'),
      'The data-site-name attribute is required for <amp-skimlinks> %s',
      this.element)
        
    const skimlinksActive = truthMap[this.element.getAttribute('data-skimlinks-active')] || true
    
    let skimlinksPage = new Page({
      skimId: skimId,
      contextWin: this.getWin()
    })
    
    let skimlinksClickHandler = new ClickHandler({
      contextWin: this.getWin()
    })
    
    let skimlinks = new Skimlinks({
      skimId: skimId,
      contextWin: this.getWin(),
      page: skimlinksPage,
      click: skimlinksClickHandler
    })
    
    new SkimlinksTracking({
      skimId: skimId,
      contextWin: this.getWin(),
      page: skimlinksPage,
      click: skimlinksClickHandler,
      loadStart: loadStart,
      skimlinksSite: skimlinksSite
    })
    
  }
  
  preconnectCallback(onLayoutUnused) {
    //
  }
  
  isLayoutSupported(unusedLayout) {
    return true;
  }

}

AMP.registerElement('amp-skimlinks', AmpSkimlinks);
