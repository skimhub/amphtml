import {toggle} from '../../../src/style';

export class AmpSkimlinks extends AMP.BaseElement {
  
  createdCallback() {
    this.getWin().document.addEventListener("click", function(e) {
      console.log(e)
    }, "false")
  }
  
  preconnectCallback(onLayoutUnused) {
    //
  }
  
  isLayoutSupported(unusedLayout) {
    return true;
  }

}

AMP.registerElement('amp-skimlinks', AmpSkimlinks);
