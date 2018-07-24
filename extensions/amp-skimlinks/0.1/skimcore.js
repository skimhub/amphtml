import {parseUrlDeprecated} from '../../../src/url';



// function attachClickHandler() {
//   document.addEventListener('click', e => {
//     const elt = e.target;
//     if (elt.href) {
//       if (isAffiliateDomain(elt)) {
//         const originalHref = elt.href;
//         elt.href = `https://go.redirectingat.com?id=${PUB_CODE}&url=${originalHref}&isjs=0`;
//         // Restore link after 300ms
//         setTimeout(() => {
//           elt.href = originalHref;
//         }, 300);
//       } else {
//         e.preventDefault()
//         // Send beacon
//         console.log('NA CLICK');
//       }

//     }
//   });
// }

/**
 * Skimcore is the main module  mostly responsible for calling beacon
 * after page load.
 * @param {Object} context
 */
export function startSkimcore(context) {
  const currentLocation = context.ampDoc.win.location;
  // TODO: Read excludedDomain option
  const excludedDomain = [currentLocation.hostname];
  const domainResolverService = new DomainResolver(context.xhr, PUB_CODE, excludedDomain);
  const affiliateService = new AffiliateLinksManager(
      context.ampDoc,
      domainResolverService.resolveUnknownAnchors.bind(domainResolverService),
      {}
  );
}


// https://github.com/ampproject/amphtml/blob/master/spec/amp-var-substitutions.md
function pageImpressionsTracking(context) {
  console.log('Page Impression');
  const data = {
    // Common
    pub: '',
    pag: window.location.href,
    guid: 'cookie',
    uuid: 'Page impression id',
    tz: 'timezone',
    sessid: 'session_id',

    // Page impresisons
    slc: 3, // Number of "Skimlinks" links
    jls: 300, // How long did it take to send the tracking,
    uc: 'xcust',
    pref: document.referrer,
    t: 1, // Type of request. Same thing as "typ: 'l'" but worse...
    jsf: '',
  };

  context.analytics.trigger('page_impressions', {data: JSON.stringify(data)});
};