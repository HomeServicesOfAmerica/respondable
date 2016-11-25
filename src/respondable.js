/**
* Returns an object a list of all values associated with the instance's matching queries as well
  as the highest priority value
* @param {Object} instance
* @param {Object[]} priority
* @return {Object} matches
*/
export function findMatches(instance, priority) {
  const matches = [];
  for (const query of instance.queries) {
    if (query.matches) {
      matches.push(query.value);
    }
  }

  // If there are no matches, return -1, otherwise the smallest index.
  const winnerIndex = matches.length ? Math.min(...matches.map(m => priority.indexOf(m))) : -1;

  instance.onChangeCb(matches, priority[winnerIndex]);
  return { matches, priority: priority[winnerIndex] };
}

/**
 * Creates an onChange handler for resizes that change the active state of a media query.
 * Returns a function that is bound to the instance
 * @param {Function} findMatches - Same as findMatches in upper scope. Passed in for testing ease.
 * @param {Object} instance
 * @param {Object[]} priority
 * @return {Function} handler
 */
// eslint-disable-next-line no-shadow
export function createQueryChangeHandler(findMatches, instance, priority) {
  return function handler() {
    if (instance && Object.keys(instance).length) {
      return findMatches(instance, priority);
    }
  };
}

/**
 * Creates a MediaQueryList instance for each query passed in by the user.
 * registers listeners for each mediaquery one and associates the provided values
 * returns an array of MediaQueryLists.
 * @param {Object} values
 * @param {Function} listenerCallback - result of createQueryChangeHandler
 * @param {Object} matchMedia - Optional, easy way to mock matchMedia for testing
 * @return {Array} queries
 */
export function mapMediaQueryLists(values, queryChangeHandler, matchMedia) {
  const queries = Object.keys(values);
  return queries.map((query) => {
    // list is a MediaQueryList instance
    const list = matchMedia(query);

    // Add the listener so we will be notified of future changes.
    list.addListener(queryChangeHandler);

    // Add a value so we will know what the current size is (in the event object).
    list.value = values[query];
    return list;
  });
}

/**
 * Checks arguments for invalid input. Throw errors if needed.
 * @param {Object} queries and values
 * @param {Function} callback
 * @param {Object[]} priority - Values from first parameter in order of descending precedance
 */
export function validateInput(values, onChangeCb, priority) {
  if (!values || typeof values !== 'object') {
    throw new Error(`Respondable requires an object as its first argument.`);
  }

  if (typeof onChangeCb !== 'function') {
    throw new Error(`Respondable requires a callback function as its second argument`);
  }
  // console.log('window', global.window);
  if (typeof window !== 'object' || typeof window.matchMedia !== 'function') {
    throw new Error(`Respondable is dependent on window.matchMedia. Please use a polyfill if matchMedia is not supported in this browser.`);
  }

  if (!Array.isArray(priority)) {
    throw new Error(`Respondable's third argument must be an array, if used.`);
  }

  if (priority.length) {
    const prioritySorted = priority.slice().sort();
    const keysSorted = Object.keys(values).map(k => values[k]).sort();

    if (prioritySorted.length !== keysSorted.length) {
      throw new Error(`The priority array's values didn't correspond to the values of the breakpoint map.`);
    }

    for (let i = 0; i < priority.length; i += 1) {
      if (prioritySorted[i] !== keysSorted[i]) {
        throw new Error(`The priority array's values didn't correspond to the values of the breakpoint map.`);
      }
    }
  }
}


/**
 * Takes in an instance object that was created inside of respondable.
 * @param {Object} instance
 */
export function destroy(instance) {
  if (instance && Object.keys(instance).length) {
    // Remove the listener for each MediaQueryList tied to this instance
    for (const mq of instance.queries) {
      mq.removeListener(instance.listenerCb);
    }

    for (const key of Object.keys(instance)) {
      delete instance[key];
    }
    return true;
  }

  // eslint-disable-next-line no-console
  console.warn(`This instance has already been destroyed.`);
  return false;
}

/**
 * Entry point for respondable. Takes the map of queries/values
 * and the callback function and registers them via MapValuesToState.
 * @param {Object} queries and values
 * @param {Function} callback
 * @param {Object[]} priority - Values from first parameter in order of descending precedance
 * @return {String} instanceID
 */
export function respondable(values, onChangeCb, priority = []) {
  // Make sure the input is valid. Throw errors if not.
  validateInput(values, onChangeCb, priority);

  // Create instance
  const instance = {};

  // Create a handler for matchMedia when a query's 'active' state changes
  instance.listenerCb = createQueryChangeHandler(findMatches, instance, priority);

  // Callback passed in by user. Made a property for convenience
  instance.onChangeCb = onChangeCb;

  // mapMediaQueryLists will register listenerCb with all the queries
  // present (as keys) in the values object that was passed in.
  instance.queries = mapMediaQueryLists(values, instance.listenerCb, window.matchMedia);

  // This method will find all active queries.
  // It is more expensive than the method used in 'createQueryChangeHandler'
  findMatches(instance, priority);

  return () => destroy(instance);
}
