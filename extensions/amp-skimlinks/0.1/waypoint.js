import {AFFILIATION_API, PLATFORM_NAME, XCUST_ATTRIBUTE_NAME} from './constants';
import {Services} from '../../../src/services';
import {addParamsToUrl} from '../../../src/url';
import {dict} from '../../../src/utils/object';


export class Waypoint {
  /**
   * @param {!../../../src/service/ampdoc-impl.AmpDoc} ampdoc
   * @param {!./tracking.Tracking} tracking
   */
  constructor(ampdoc, tracking) {
    /** @private {?./tracking.Tracking} */
    this.tracking_ = tracking;

    /** @private {string} */
    this.documentReferrer_ = ampdoc.win.document.referrer;

    /** @private {string} */
    this.canonicalUrl_ = Services.documentInfoForDoc(ampdoc).canonicalUrl;

    /** @private {string} */
    this.timezone_ = `${new Date().getTimezoneOffset()}`;
  }

  /**
   *
   * @param {HTMLElement} anchor
   * @return {?string}
   */
  getAffiliateUrl(anchor) {
    if (!anchor) {
      return null;
    }

    const {
      pubcode,
      pageImpressionId,
      customTrackingId,
      guid,
    } = this.tracking_.getTrackingInfo();

    const xcust = anchor.getAttribute(XCUST_ATTRIBUTE_NAME) || customTrackingId;

    const queryParams = dict({
      'id': pubcode,
      'url': anchor.href,
      'sref': this.canonicalUrl_,
      'pref': this.documentReferrer_,
      'xguid': guid,
      'xuuid': pageImpressionId,
      'xtz': this.timezone_,
      'xs': '1', // Always use source_app=1 (skimlinks)
      'platform': PLATFORM_NAME,
    });
    if (xcust) {
      queryParams['xcust'] = xcust;
    }

    return addParamsToUrl(AFFILIATION_API, /** @type {!JsonObject} */ (queryParams));
  }
}
