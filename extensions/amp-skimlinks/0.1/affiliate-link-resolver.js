import {
  LINK_STATUS__AFFILIATE, LINK_STATUS__IGNORE_LINK, LINK_STATUS__NON_AFFILIATE,
  LINK_STATUS__UNKNOWN,
} from './affiliate-links-manager';
import {parseUrlDeprecated} from '../../../src/url';

import {AnchorRewriteData, AnchorRewriteDataResponse} from '../../../src/service/link-rewrite/link-rewrite-classes';


export default class AffiliateLinkResolver {
  /**
   *
   * @param {*} xhr
   * @param {*} skimOptions
   * @param {*} beaconApiCallback
   */
  constructor(xhr, skimOptions, beaconApiCallback) {
    this.xhr_ = xhr;
    this.pubcode_ = skimOptions.pubcode;
    this.domains_ = {};
    this.excludedDomains_ = skimOptions.excludedDomains;
    this.beaconApiCallback_ = beaconApiCallback;
  }

  /**
   *
   * @param {*} anchorList
   * @return {Promise}
   */
  resolveUnknownAnchors(anchorList) {
    const alreadyResolved = this.resolveAnchorsRewriteData(anchorList);
    let willBeResolvedPromise = null;

    const domainsToAsk = this.getNewDomains_(anchorList);
    if (domainsToAsk.length) {
      // Set domains to LINK_STATUS__UNKNOWN to mark them as aready requested.
      this.markDomainsAsUnknown(domainsToAsk);
      // Get anchors waiting for the API response to be resolved.
      const pendingAnchors = this.getPendingAnchors_(anchorList, domainsToAsk);
      willBeResolvedPromise = this.resolvedUnknownAnchorsAsync_(pendingAnchors, domainsToAsk);
    }

    return new AnchorRewriteDataResponse(alreadyResolved, willBeResolvedPromise);
  }

  /**
   * Get replacement url.
   * @param {*} anchor
   */
  getWaypointUrl_(anchor) {
    return `https://go.redirectingat.com?id=${this.pubcode_}&url=${anchor.href}`;
  }

  /**
   * Build list of AnchorRewriteData
   * @param {*} anchorList
   */
  resolveAnchorsRewriteData(anchorList) {
    const anchorListNormalised = anchorList.map(anchor => {
      const status = this.getDomainAffiliateStatus_(this.getLinkDomain(anchor));
      // Always replace unknown, we will overwrite them after asking beacon if needed
      if (status === LINK_STATUS__AFFILIATE || status === LINK_STATUS__UNKNOWN) {
        const replacementUrl = this.getWaypointUrl_(anchor);
        return new AnchorRewriteData(anchor, replacementUrl);
      }

      return new AnchorRewriteData(anchor);
    });

    return anchorListNormalised;
  }

  /**
   * Get affiliate status of one domain
   * @param {*} domain
   */
  getDomainAffiliateStatus_(domain) {
    if (this.isExcludedDomain_(domain)) {
      return LINK_STATUS__IGNORE_LINK;
    }

    return this.domains_[domain] || LINK_STATUS__UNKNOWN;
  }

  /**
   * Get list of domains we don't have information about from a list of anchor.
   * @param {*} anchorList
   */
  getNewDomains_(anchorList) {
    const domains = anchorList.map(this.getLinkDomain);

    return domains.reduce(((acc, domain) => {
      const isResolved = this.domains_[domain];
      const isExcluded = this.isExcludedDomain_(domain);
      const isDuplicate = acc.indexOf(domain) !== -1;

      if (!isResolved && !isExcluded && !isDuplicate) {
        acc.push(domain);
      }

      return acc;
    }), []);
  }

  /**
   * Save domains as unknown status in the internal state.
   * @param {string[]} domains
   */
  markDomainsAsUnknown(domains) {
    domains.forEach(domain => {
      const domainStatus = this.domains_[domain];
      if (domainStatus && domainStatus !== LINK_STATUS__UNKNOWN) {
        return;
      }

      if (this.isExcludedDomain_(domain)) {
        this.domains_[domain] = LINK_STATUS__IGNORE_LINK;
      }

      this.domains_[domain] = LINK_STATUS__UNKNOWN;
    });
  }

  /**
   * Get the list of anchors for which the domain of the href is in the `domainsToAsk` list.
   * @param {*} anchorList
   * @param {string[]} domainsToAsk
   */
  getPendingAnchors_(anchorList, domainsToAsk) {
    return anchorList.reduce((acc, anchor) => {
      const anchorDomain = this.getLinkDomain(anchor);
      if (domainsToAsk.indexOf(anchorDomain) !== -1) {
        acc.push(anchor);
      }

      return acc;
    }, []);
  }

  /**
   * Resolve in an asynchronous way.
   * @param {*} anchorList
   * @param {*} domainsToAsk
   */
  resolvedUnknownAnchorsAsync_(anchorList, domainsToAsk) {
    return this.fetchDomainResolverApi(domainsToAsk).then(data => {
      // DomainResolverApi (beaconApi) returns extra meta-data that we want to handle
      // oustide of the resolveUnknownDomains process.
      this.beaconApiCallback_(data);

      this.updateDomainsStatusMapPostFetch_(domainsToAsk, data.merchant_domains);

      return this.resolveAnchorsRewriteData(anchorList);
    });
  }

  /**
   * Call beacon
   * @param {*} domains
   */
  fetchDomainResolverApi(domains) {
    const data = {
      pubcode: this.pubcode_,
      page: '',
      domains,
    };

    const beaconUrl = `https://r.skimresources.com/api?data=${JSON.stringify(data)}`;
    const postReq = {
      method: 'GET',
      // Disabled AMP CORS for dev
      requireAmpResponseSourceOrigin: false,
      ampCors: false,
      // Allow beacon API to set cookies
      credentials: 'include',
    };

    return this.xhr_.fetchJson(beaconUrl, postReq).then(res => {
      return res.json();
    });
  }

  /**
   *
   * @param {*} allDomains
   * @param {*} affiliateDomains
   */
  updateDomainsStatusMapPostFetch_(allDomains, affiliateDomains) {
    allDomains.forEach(domain => {
      const isAffiliateDomain = affiliateDomains.indexOf(domain) !== -1;
      this.domains_[domain] = isAffiliateDomain ? LINK_STATUS__AFFILIATE : LINK_STATUS__NON_AFFILIATE;
    });
  }

  /**
   *
   * @param {*} anchor
   */
  getLinkDomain(anchor) {
    return parseUrlDeprecated(anchor.href).hostname;
  }

  /**
   *
   * @param {*} domain
   */
  isExcludedDomain_(domain) {
    // Should update the isExcluded list as a side effect for caching
    if (!this.excludedDomains_.length) {
      return false;
    }

    // TODO: Validate subdomain (*.nordstrom.com)
    if (this.excludedDomains_.indexOf(domain) === -1) {
      return false;
    }

    return true;
  }
}
