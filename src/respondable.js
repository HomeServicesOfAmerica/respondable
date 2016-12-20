// @flow
import type {
  ExtendedMQL,
  RespondableInstance,
  FindMatches,
  CreateQueryChangeHandler,
  MapMediaQueryLists,
  ValidateInput,
  Destroy,
  Respondable,
} from './types';

// Warning and error messages used within the file. Exported for testing ease.
export const WARN_INSTANCE_ALREADY_DESTROYED = `This instance has already been destroyed.`;
export const WARN_EARLY_FIND_MATCHES_INVOKE = `Early invokation of findMatches. This should only `
+ `happen if using this function in isolation`;
export const ERROR_INVALID_BREAKPOINT_CONFIG_TYPE = `Respondable requires an object as its first `
+ `param.`;
export const ERROR_INVALID_CALLBACK_TYPE = `Respondable requires a callback function as its second `
+ `param`;
export const ERROR_INVALID_PRIORITY_TYPE = `Respondable's third param must be an array, if used.`;
export const ERROR_MATCH_MEDIA_TYPE = `Respondable is dependent on window.matchMedia. Please use a `
+ `polyfill if matchMedia is not supported in this browser.`;
export const ERROR_INVALID_PRIORITY_ARRAY_COMPOSITION = `The priority array's values didn't `
+ `correspond to the values of the breakpoint map.`;

/**
 * @summary Finds all active queries and the high-priority query (if applicable). The results are
 * passed into onChangeCb and returned.
 */
export const findMatches: FindMatches = (instance, priority) => {
  // If the query property does not exist on the instance yet, exit early and don't trigger callback
  // This is mainly a safeguard for future changes and to appease Flow
  if (!(instance.queries && Array.isArray(instance.queries))) {
    console.warn(WARN_EARLY_FIND_MATCHES_INVOKE); // eslint-disable-line no-console
    return;
  }

  const matches = [];
  for (const query of instance.queries) {
    if (query.matches) {
      matches.push(query.value);
    }
  }

  // If there are no matches, return -1, otherwise the smallest index.
  const priorityIndex = matches.length ? Math.min(...matches.map(m => priority.indexOf(m))) : -1;

  instance.onChangeCb(matches, priority[priorityIndex]);
  return { matches, priority: priority[priorityIndex] };
};

/**
 * @summary Creates a handler that will be used for subscribing and unsubscribing to query changes.
 * It will not invoke findMatches (and therefore onChangeCb) after destroy has been called.
 *
 * NOTE: findMatches in the upper scope is passed into this function to ease testing
 */
export const createQueryChangeHandler: CreateQueryChangeHandler =
  // eslint-disable-next-line no-shadow
  (findMatches, instance, priority) =>
    function handler() {
      if (instance && Object.keys(instance).length) {
        return findMatches(instance, priority);
      }
    };

/**
 * @summary Creates a MediaQueryList for each query in the breakpoints object and registers
 * queryChangeHandler as a listener to subscribe to future changes.
 *
 * @param breakpoints        Object passed in by user (first param of respondable)
 * @param listenerCallback   result of createQueryChangeHandler
 * @param matchMedia         Optional mock for matchMedia
 */
export const mapMediaQueryLists: MapMediaQueryLists =
  (breakpoints, queryChangeHandler, matchMedia) => {
    const queries = Object.keys(breakpoints);
    return queries.map((query) => {
      const list: ExtendedMQL = matchMedia(query);

      list.addListener(queryChangeHandler);

      // Add a value so we will can determine which query is active in findMatches.
      list.value = breakpoints[query];
      return list;
    });
  };

/**
 * @summary Checks that respondable recieved valid input and will throws errors if needed.
 */
export const validateInput: ValidateInput = (breakpoints, onChangeCb, priority) => {
  if (!breakpoints || typeof breakpoints !== 'object') {
    throw new TypeError(ERROR_INVALID_BREAKPOINT_CONFIG_TYPE);
  }

  if (typeof onChangeCb !== 'function') {
    throw new TypeError(ERROR_INVALID_CALLBACK_TYPE);
  }

  if (typeof window !== 'object' || typeof window.matchMedia !== 'function') {
    throw new TypeError(ERROR_MATCH_MEDIA_TYPE);
  }

  if (!Array.isArray(priority)) {
    throw new TypeError(ERROR_INVALID_PRIORITY_TYPE);
  }

  if (priority.length) {
    const breakpointNames = Object.keys(breakpoints).map(key => breakpoints[key]);
    const invalid = priority.some(cur =>
      // Invalid if a priority item isn't present in breakpoints provided, or if it is repeated.
      !breakpointNames.includes(cur) || priority.indexOf(cur) !== priority.lastIndexOf(cur));

    if (invalid) {
      throw new Error(ERROR_INVALID_PRIORITY_ARRAY_COMPOSITION);
    }
  }
};


/**
 * @summary Receives the 'instance' object created by respondable and unregisters its listeners.
 */
export const destroy: Destroy = (instance) => {
  // This checking is verbose, but making these properties required in the Respondable type is worse
  if (typeof instance === 'object'
    && Array.isArray(instance.queries)
    && Object.keys(instance).length
    && typeof instance.listenerCb === 'function'
  ) {
    // Remove the listener for each MediaQueryList tied to this instance
    for (const mq of instance.queries) {
      mq.removeListener(instance.listenerCb);
    }

    // Remove references. Ensures that the queryChangeHandler will not be invoked again.
    for (const key of Object.keys(instance)) {
      delete instance[key];
    }
    return true;
  }

  // eslint-disable-next-line no-console
  console.warn(WARN_INSTANCE_ALREADY_DESTROYED);
  return false;
};

/**
 * @summary Entry point for respondable. Receives an object of queries/values and invokes the
 * callback with all active queries whenever any of the queries change. Returns a function that
 * will remove all listeners.
 *
 * @param breakpoints  Object with matchMedia compliant mediaQueries as keys
 * @param callback     Invoked with current queries whenever a query's active state changes
 * @param priority     Values from first parameter in order of descending precedance
 */
export const respondable: Respondable = (breakpoints, onChangeCb, priority = []) => {
  validateInput(breakpoints, onChangeCb, priority);

  const instance: RespondableInstance = { onChangeCb };

  instance.listenerCb = createQueryChangeHandler(findMatches, instance, priority);
  instance.queries = mapMediaQueryLists(breakpoints, instance.listenerCb, window.matchMedia);

  findMatches(instance, priority);

  return () => destroy(instance);
};
