import {hasOwn} from '../../utils/object';
import {user} from '../../log';


/**
 * Create a response object for 'resolveUnknownAnchors()' function
 * in the format expected by LinkRewriter.
 *
 * Some replacement urls may be determined synchronously but others may need an
 * asynchronous call. Being able to return a sync and async response offers
 * flexibility to handle all these scenarios:
 *
 * - If you don't need any api calls to determine your replacement url.
 *   Use: createTwoStepsResponse(syncResponse)
 *
 * - If you need a an api call to determine your replacement url
 *   Use: createTwoStepsResponse(null, asyncResponse)
 *
 * - If you need an api call to determine your replacement url but
 *   have implemented a synchronous cache system.
 *   Use: createTwoStepsResponse(syncResponse, asyncResponse);
 *
 * - If you want to return a temporary replacement url until you get the
 *   real replacement url from your api call.
 *   Use:  createTwoStepsResponse(syncResponse, asyncResponse)
 *
 * @param {?Array<{anchor: HTMLElement, replacementUrl: ?string}>} syncResponse
 * @param {?Promise} asyncResponse
 * @return {Object} - "two steps response" {syncResponse, asyncResponse}
 */
export function createTwoStepsResponse(syncResponse, asyncResponse) {
  if (asyncResponse) {
    user().assert(asyncResponse instanceof Promise,
        'createTwoStepsResponse(syncResponse, asyncResponse), if provided, second argument needs to be a promise');
  }
  return {
    syncResponse,
    asyncResponse,
  };
}


/**
 *
 * @param {*} twoStepsResponse
 */
export function isTwoStepsResponse(twoStepsResponse) {
  const isValid = twoStepsResponse && (
    hasOwn(twoStepsResponse, 'syncResponse') ||
    hasOwn(twoStepsResponse, 'asyncResponse'));

  return Boolean(isValid);
}