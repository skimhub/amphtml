import {user} from '../../log';

import {AnchorRewriteData, AnchorRewriteDataResponse} from './link-rewrite-classes';
import {EVENTS, ORIGINAL_URL_ATTRIBUTE} from './constants';
import EventMessenger from './event-messenger';

export default class LinkRewriter {
  /**
   * Create a new linkRewriter instance you can then register to the LinkRewriteService.
   * @param {*} name
   * @param {*} resolveUnknownLinks
   * @param {*} options
   */
  constructor(name, resolveUnknownLinks, options) {
    this.name = name;
    this.askAnchorRewriteStatus_ = resolveUnknownLinks;
    this.linkSelector = options.linkSelector;
    this.anchorReplacementMap_ = new Map();
    this.restoreDelay_ = 300; //ms
    this.events = new EventMessenger();
    window.debugMap = this.anchorReplacementMap_;
  }

  /**
   * Get the replacement url for a specific anchor.
   * @param {HTMLElement} anchor
   * @return {string}
   */
  getReplacementUrl(anchor) {
    if (!this.isWatchingLink(anchor)) {
      return null;
    }

    return this.anchorReplacementMap_.get(anchor).replacementUrl;
  }

  /**
   * Get the anchor to replacement url Map
   * @return {Map}
   */
  getAnchorLinkReplacementMap() {
    return this.anchorReplacementMap_;
  }

  /**
   * Returns True if the link is not excluded by the linkSelector option.
   * @param {*} anchor
   */
  isWatchingLink(anchor) {
    return this.anchorReplacementMap_.has(anchor);
  }

  /**
   * Swap temporarly the href of an anchor by the associated replacement url.
   * @param {*} anchor
   */
  rewriteAnchorUrl(anchor) {
    const newUrl = this.getReplacementUrl(anchor);
    if (!newUrl || newUrl === anchor.href) {
      return false;
    }
    // Save so we can restore it.
    anchor.setAttribute(ORIGINAL_URL_ATTRIBUTE, anchor.href);
    anchor.href = newUrl;
    // Restore link to original after X ms.
    setTimeout(() => {
      anchor.href = anchor.getAttribute(ORIGINAL_URL_ATTRIBUTE);
      anchor.removeAttribute(ORIGINAL_URL_ATTRIBUTE);
    }, this.restoreDelay_);

    return true;
  }

  /**
   * Scan the page to find links and send events when scan is complete.
   */
  onDomUpdated() {
    this.scanLinksOnPage_().then(() => {
      this.events.send(EVENTS.PAGE_SCANNED);
    });
  }

  /**
   * Find all the anchors in the page (based on linkSelector option) and
   */
  scanLinksOnPage_() {
    const anchorList = this.getLinksInDOM_();
    this.removeDetachedAnchorsFromMap_(anchorList);

    // Get the list of new links.
    const unknownAnchors = this.getNewAnchors_(anchorList);

    //  Ask for the affiliate status of the new anchors.
    if (unknownAnchors.length) {
      // Mark all new anchors discovered to the default unknown.
      // Note: Only anchors with a status will be considered in the click handlers.
      // (Other anchors are assumed to be the ones exluded by linkSelector_)
      this.updateAnchorMap_(unknownAnchors.map(anchor => {
        return new AnchorRewriteData(anchor);
      }));
      const response = this.askAnchorRewriteStatus_(unknownAnchors);
      user().assert(
          response instanceof AnchorRewriteDataResponse,
          // TODO: add link to readme
          '"resolveUnknownAnchors" returned value should be an instance of AnchorRewriteDataResponse',
      );
      // Anchors for which the status can be resolved synchronously
      if (response.syncData) {
        this.updateAnchorMap_(response.syncData);
      }

      // Anchors for which the status needs to be resolved asynchronously
      if (response.asyncData) {
        return response.asyncData.then(this.updateAnchorMap_.bind(this));
      }
    }

    return Promise.resolve();
  }

  /**
   * Filter the list of anchors to returns only the ones
   * that were not in the page at the time of the last page scan.
   * @param {*} anchorList
   */
  getNewAnchors_(anchorList) {
    const unknownAnchors = [];
    anchorList.forEach(anchor => {
      if (!this.anchorReplacementMap_.has(anchor)) {
        unknownAnchors.push(anchor);
      }
    });

    return unknownAnchors;
  }

  /**
  * Update the state of the internal Anchor to replacement url Map.
  * @param {*} anchorRewriteDataList
  */
  updateAnchorMap_(anchorRewriteDataList) {
    anchorRewriteDataList.forEach(anchorRewriteData => {
      user().assert(anchorRewriteData instanceof AnchorRewriteData,
          'Expected instance of "AnchorRewriteData"'
      );
      this.anchorReplacementMap_.set(anchorRewriteData.anchor, anchorRewriteData);
    });
  }

  /**
   * Remove from the internal anchor Map the links that are no longer in the page.
   * @param {*} anchorList - The list of links in the page.
   */
  removeDetachedAnchorsFromMap_(anchorList) {
    this.anchorReplacementMap_.forEach((value, anchor) => {
      // Delete if anchor is not in the DOM anymore so it can
      // be garbage collected.
      if (anchorList.indexOf(anchor) === -1) {
        this.anchorReplacementMap_.delete(anchor);
      }
    });
  }

  /**
   * Get the list of anchors element in the page.
   * (Based on linkSelector option)
   */
  getLinksInDOM_() {
    return [].slice.call(document.querySelectorAll(this.linkSelector_ || 'a'));
  }
}
