import {toggle} from '../../../src/style';
import {Skimlinks} from './skimlinks';

export class AmpSkimlinks extends AMP.BaseElement {
  
  createdCallback() {
    const skimId = AMP.assert(this.element.getAttribute('data-skim-id'),
      'The data-do attribute is required for <amp-skimlinks> %s',
      this.element);
    
    new Skimlinks({
      skimId: skimId,
      winContext: this.getWin()
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
