import {AmpSkimlinks} from '../amp-skimlinks';
import {CustomEventReporterBuilder} from '../../../../src/extension-analytics';
import {Services} from '../../../../src/services';
import {Tracking} from '../tracking';
import {pubcode} from './constants';

const helpersFactory = env => {
  const {win} = env;

  return {
    createAnchor(href) {
      const anchor = win.document.createElement('a');
      anchor.href = href;

      return anchor;
    },

    createStubXhr(data) {
      const response = {
        json: () => {
          return Promise.resolve(data);
        },
      };

      return {
        fetchJson: env.sandbox.stub().returns(Promise.resolve(response)),
      };
    },

    mockServiceGetter(getterName, returnValue) {
      env.sandbox.stub(Services, getterName);
      Services[getterName].returns(returnValue);
    },

    stubCustomEventReporterBuilder() {
      env.sandbox.stub(CustomEventReporterBuilder.prototype, 'track');
      env.sandbox.stub(CustomEventReporterBuilder.prototype, 'build').returns({
        trigger: env.sandbox.stub(),
        config_: {},
      });
    },

    createTrackingWithStubAnalytics(skimOptions) {
      skimOptions = Object.assign(
          {
            tracking: true,
            pubcode,
          },
          skimOptions
      );
      this.stubCustomEventReporterBuilder();

      return new Tracking(env, skimOptions);
    },

    getAnalyticsUrlVars(trackingService, eventName) {
      const stub = trackingService.analytics_.trigger;
      expect(stub.withArgs(eventName).calledOnce).to.be.true;
      const analyticsData = stub.withArgs(eventName).args[0][1];
      expect(analyticsData).to.be.an('object');

      return analyticsData;
    },

    createAmpSkimlinks(extensionAttrs) {
      const el = document.createElement('amp-skimlinks');
      for (const k in extensionAttrs) {
        el.setAttribute(k, extensionAttrs[k]);
      }
      el.getAmpDoc = () => env.ampdoc;

      return new AmpSkimlinks(el);
    },
  };
};

export default helpersFactory;
