import {toggle} from '../../../src/style';
import {Skimlinks} from './skimlinks';
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
      'The data-do attribute is required for <amp-skimlinks> %s',
      this.element);
    
    const skimlinksActive = truthMap[this.element.getAttribute('data-skimlinks-active')] || true
    
    let skimlinksPage = new Page({
      skimId: skimId,
      contextWin: this.getWin()
    })
    
    let skimlinks = new Skimlinks({
      skimId: skimId,
      contextWin: this.getWin(),
      page: skimlinksPage
    })
    
    new SkimlinksTracking({
      skimId: skimId,
      contextWin: this.getWin(),
      page: skimlinksPage,
      loadStart: loadStart
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
