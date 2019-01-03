import {BrowserController, RequestBank} from '../../testing/test-helper';
import {PLATFORM_NAME} from '../../extensions/amp-skimlinks/0.1/constants';
import {parseQueryString} from '../../src/url';

// Create fake test urls to replace skimlinks API urls.
// RequestBank allow us to check if an API request has been made
// or not by calling RequestBank.withdraw later.
const pageTrackingUrl = RequestBank.getUrl('pageTrackingUrl') +
  '/track.php?data=${data}';
const linksTrackingUrl = RequestBank.getUrl('linksTrackingUrl') +
  '/link?data=${data}';
const nonAffiliateTrackingUrl = RequestBank.getUrl('nonAffiliateTrackingUrl') +
  '?call=track&data=${data}';
const waypointUrl = `${RequestBank.getUrl('waypointUrl')}`;


// Simulated click event created by browser.click() does not trigger
// the browser navigation when dispatched on a link.
// Using MouseEvent("click") instead of Event("click") does,
// which is what we need for those tests.
function clickLink_(doc, selector) {
  const element = doc.querySelector(selector);
  if (element) {
    const clickEvent = new MouseEvent('click', {bubbles: true});
    element.dispatchEvent(clickEvent);
  }
}

const setupBasic = {
  extensions: ['amp-skimlinks'],
  body: `
    <amp-skimlinks
        layout="nodisplay"
        publisher-code="123X123"
        tracking="true"
    >
      <script type="application/json">
        {
            "pageTrackingUrl": "${pageTrackingUrl}",
            "linksTrackingUrl": "${linksTrackingUrl}",
            "nonAffiliateTrackingUrl": "${nonAffiliateTrackingUrl}",
            "waypointUrl": "${waypointUrl}"
        }
      </script>
    </amp-skimlinks>
    <div>
        <a id="merchant-link" href="https://nordstrom.com"> Test Merchant </a>
        <a id="non-merchant-link" href="https://google.com"> Test non-Merchant </a>
    </div>
  `,
};

const setupNoConfig = {
  extensions: ['amp-skimlinks'],
  body: `
      <amp-skimlinks
          layout="nodisplay"
          publisher-code="123X123"
          tracking="true"
      >
      </amp-skimlinks>
      <div>
          <a id="merchant-link" href="https://nordstrom.com"> Test Merchant </a>
          <a id="non-merchant-link" href="https://google.com"> Test non-Merchant </a>
      </div>
  `,
};

describe('amp-skimlinks', function() {
  describes.integration('Basic features', setupBasic, env => {
    let browser = null;
    let clickLink = null;

    beforeEach(() => {
      clickLink = selector => clickLink_(env.win.document, selector);
      browser = new BrowserController(env.win);
      return browser.waitForElementBuild('amp-skimlinks');
    });

    it('Should send the page impression tracking request', () => {
      return RequestBank.withdraw('pageTrackingUrl').then(req => {
        const regex = /^\/track\.php\?data=([^&]*)&?.*$/;
        const match = regex.exec(req.url);

        expect(match).to.have.lengthOf(2);
        const data = JSON.parse(decodeURIComponent(match[1]));
        expect(data.jv).to.equal(PLATFORM_NAME);
        expect(data.pub).to.equal('123X123');
        // nonblocking.io is the default canonical url
        expect(data.pag).to.equal('http://nonblocking.io/');
        expect(data.uuid).to.have.lengthOf(32);

      });
    });

    it('Should send the links impression tracking request', () => {
      return RequestBank.withdraw('linksTrackingUrl').then(req => {
        const regex = /^\/link\?data=([^&]*)&?.*$/;
        const match = regex.exec(req.url);

        expect(match).to.have.lengthOf(2);
        const data = JSON.parse(decodeURIComponent(match[1]));
        expect(data.jv).to.equal(PLATFORM_NAME);
        expect(data.pub).to.equal('123X123');
        // nonblocking.io is the default canonical url
        expect(data.pag).to.equal('http://nonblocking.io/');
        expect(data.uuid).to.have.lengthOf(32);

        expect(data.hae).to.equal(1);
        expect(data.dl).to.deep.equal({
          'https://nordstrom.com/': {count: 1, ae: 1},
          'https://google.com/': {count: 1, ae: 0},
        });
      });
    });

    it('Should send NA-tracking on non-merchant link click ', () => {
      // Give 500ms for amp-skimlinks to set up
      return browser.wait(500).then(() => {
        clickLink('#non-merchant-link');

        return RequestBank.withdraw('nonAffiliateTrackingUrl').then(req => {
          const regex = /^\/\?call=track&data=([^&]*)&?.*$/;
          const match = regex.exec(req.url);
          expect(match).to.have.lengthOf(2);
          const data = JSON.parse(decodeURIComponent(match[1]));
          expect(data.url).to.equal('https://google.com/');
          expect(data.referrer).to.equal('http://nonblocking.io/');
          expect(data.jv).to.equal(PLATFORM_NAME);
          expect(data.uuid).to.have.lengthOf(32);
          expect(data.pref).to.have.lengthOf.above(1);
        });
      });
    });

    it('Should send to waypoint on merchant link click', () => {
      // Give 500ms for amp-skimlinks to set up
      return browser.wait(500).then(() => {
        clickLink('#merchant-link');
        return RequestBank.withdraw('waypointUrl').then(req => {
          // Remove "/?..." in the url
          const queryString = req.url.slice(2);
          const queryParams = parseQueryString(queryString);
          expect(queryParams.id).to.equal('123X123');
          expect(queryParams.jv).to.equal(PLATFORM_NAME);
          expect(queryParams.xuuid).to.have.lengthOf(32);
          expect(queryParams.url).to.equal('https://nordstrom.com/');
          expect(queryParams.sref).to.equal('http://nonblocking.io/');
          expect(queryParams.pref).to.have.lengthOf.above(1);
          expect(queryParams.xs).to.equal('1');
        });
      });
    });
  });


  // The purpose of these tests is to make sure that amp-skimlinks still
  // works when the JSON config necessary to run our tests is not
  // injected (similar to live environment).
  // Since the JSON config is not set we can not use the proxy and
  // therefore can only test a small subset of features.
  describes.integration('Works without test config', setupNoConfig, env => {
    let browser = null;
    let clickLink = null;

    beforeEach(() => {
      clickLink = selector => clickLink_(env.win.document, selector);
      browser = new BrowserController(env.win);
      return browser.waitForElementBuild('amp-skimlinks');
    });


    it('Should send to waypoint on merchant link click', () => {
      // Give 500ms for amp-skimlinks to set up
      return browser.wait(500).then(() => {
        clickLink('#merchant-link');
        const link = env.win.document.querySelector('#merchant-link');
        const regex = /^https\:\/\/go\.skimresources\.com\/\?(.*)$/;
        const match = regex.exec(link.href);
        expect(match).to.be.lengthOf(2);
        const queryParams = parseQueryString(match[1]);
        expect(queryParams.id).to.equal('123X123');
        expect(queryParams.jv).to.equal(PLATFORM_NAME);
        expect(queryParams.xuuid).to.have.lengthOf(32);
        expect(queryParams.url).to.equal('https://nordstrom.com/');
        expect(queryParams.sref).to.equal('http://nonblocking.io/');
        expect(queryParams.pref).to.have.lengthOf.above(1);
        expect(queryParams.xs).to.equal('1');
      });
    });
  });

});