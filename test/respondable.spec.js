import test from 'ava';
import matchMedia from './matchmedia-mock';
import {
  destroy,
  respondable,
  findMatches,
  createQueryChangeHandler,
  mapMediaQueryLists,
} from '../src/respondable.js';

import respondableExport from '../src/index';

const breakpoints = {
  'screen and (max-width: 413px)': 'smallest',
  'screen and (min-width: 414px) and (max-width: 767px)': 'small',
  'screen and (min-width: 768px) and (max-width: 1079px)': 'medium',
  'screen and (min-width: 1080px) and (max-width: 1399px)': 'large',
  'screen and (min-width: 1400px)': 'largest',
};

test('index.js', (t) => {
  t.plan(1);

  // Verify that respondable is being exported by index.js
  t.is(respondableExport, respondable);
});

test('respondable', (t) => {
  t.plan(7);
  t.true(typeof respondable === 'function');

  // Checking argument validation
  t.throws(() => respondable(undefined, () => {}), 'Respondable requires an object as its first argument.');
  t.throws(() => respondable({}, undefined), 'Respondable requires a callback function as its second argument');

  // If window is undefined throw error.
  t.throws(() => respondable({}, () => {}), 'Respondable is dependent on window.matchMedia. Please use a polyfill if matchMedia is not supported in this browser.');

  // If window.matchMedia is undefined throw error.
  global.window = {};
  t.throws(() => respondable({}, () => {}), 'Respondable is dependent on window.matchMedia. Please use a polyfill if matchMedia is not supported in this browser.');

  // If all arguments are correct and window.matchMedia is defined, don't throw error.
  global.window = { matchMedia };
  t.notThrows(() => respondable({}, () => {}), 'Respondable is dependent on window.matchMedia. Please use a polyfill if matchMedia is not supported in this browser.');

  // Check that respondable is returning a destroy function.
  const destroyIt = respondable(breakpoints, () => {});
  t.true(typeof destroyIt === 'function');
});

test('destroy', (t) => {
  t.plan(6 + (Object.keys(breakpoints).length * 2));

  // Respondable should return a function. It is a wrapper for destroy
  t.true(typeof respondable === 'function');
  const destroyIt = respondable(breakpoints, () => {});
  t.true(typeof destroyIt === 'function');
  t.true(String(destroyIt).includes('destroy('));

  /* eslint-disable no-unused-vars */
  let calledCount;
  let calledWith;
  /* eslint-enable no-unused-vars */

  // Mock the query change handler
  const queryChangeHandler = () => {};

  // Keep a reference to query property so we can test that listeners were destroyed
  const mockMQL = mapMediaQueryLists(breakpoints, queryChangeHandler, matchMedia);

  // Mock an instance in state
  const instance = {
    queries: mockMQL,
    onChangeCb: (...args) => {
      calledCount += 1;
      calledWith = args;
    },
    listenerCb: queryChangeHandler,
  };

  // All MQ objects should have a single listener
  for (const mockMQ of mockMQL) {
    t.is(mockMQ.listeners.length, 1);
  }

  const successWrong = destroy();
  t.false(successWrong);

  const successCorrect = destroy(instance);
  t.true(successCorrect);

  // All MQ objects should have no listeners
  for (const mockMQ of mockMQL) {
    t.is(mockMQ.listeners.length, 0);
  }

  // All keys should be deleted
  t.is(Object.keys(instance).length, 0);
});

test('mapMediaQueryLists', (t) => {
  t.plan(2 + (Object.keys(breakpoints).length * 4));

  const queryChangeHandler = () => {};

  t.is(typeof mapMediaQueryLists, 'function');
  const mockMQL = mapMediaQueryLists(breakpoints, queryChangeHandler, matchMedia);
  t.true(Array.isArray(mockMQL));

  // Each MQ should have a registered listener, and both value and query properties
  for (const mockMQ of mockMQL) {
    t.is(breakpoints[mockMQ.query], mockMQ.value);
    t.true(Array.isArray(mockMQ.listeners));
    t.is(mockMQ.listeners.length, 1);
    t.is(mockMQ.listeners[0], queryChangeHandler);
  }
});

test('findMatches', (t) => {
  t.plan(6);
  t.true(typeof findMatches === 'function');

  // initialize instance and onChangeCb spies
  let calledCount = 0;
  let calledWith = null;
  const instance = {
    queries: [
      { matches: true, value: 'bob' },
      { matches: true, value: 'alice' },
      { matches: false, value: 'frank' },
    ],
    onChangeCb: (...args) => {
      calledCount += 1;
      calledWith = args;
    },
  };

  // Given the correct parameters, findMatches should return an array.
  t.is(calledCount, 0);
  const matchingValues = findMatches(instance);
  t.is(calledCount, 1);
  t.true(Array.isArray(matchingValues));

  // The array should contain the values of query items that have matches set to true.
  t.deepEqual(['bob', 'alice'], matchingValues);

  // onChangeCb should be passed the same object that was returned.
  t.is(calledWith[0], matchingValues);
});

test('createQueryChangeHandler', (t) => {
  t.plan(9);

  let calledCount = 0;
  const mockFindMatches = () => {
    calledCount += 1;
    return true;
  };
  const mockInstance = {};

  // createQueryChangeHandler should be a function
  t.true(typeof createQueryChangeHandler === 'function');

  // createQueryChangeHandler should return a function and not call findMatches
  const handlerWrong = createQueryChangeHandler(mockFindMatches);
  t.true(typeof handlerWrong === 'function');
  t.is(calledCount, 0);

  // If createQueryChangeHandler is not passed an instance,
  // findMatches should not be invoked
  t.is(handlerWrong(), undefined);
  t.is(calledCount, 0);

  // If given the correct parameters, createQueryChangeHandler should invoke
  // findMatches and return the result.
  const handlerCorrect = createQueryChangeHandler(mockFindMatches, mockInstance);
  t.true(typeof handlerCorrect === 'function');
  t.is(calledCount, 0);
  t.is(handlerCorrect(), true);
  t.is(calledCount, 1);
});
