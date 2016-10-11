import test from 'ava';
import matchMedia from './matchmedia-mock';
import {
  state,
  destroy,
  destroyNext,
  respondable,
  respondableNext,
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

test('respondableNext', (t) => {
  t.plan(6);
  t.true(typeof respondableNext === 'function');

  // Respondable should export next unmodified and as a property of respondable
  t.is(respondableNext, respondable.next);

  // Checking argument validation
  t.throws(() => respondableNext(undefined, () => {}), 'Respondable requires an object as its first argument.');
  t.throws(() => respondableNext({}, undefined), 'Respondable requires a callback function as its second argument');
  t.throws(() => respondableNext({}, () => {}, {}), 'Respondable has an optional third parameter for matchMediaPolyFill of type function.');

  // Check that resondableNext is returning a destroy function.
  const destroyIt = respondableNext(breakpoints, () => {}, matchMedia);
  t.true(typeof destroyIt === 'function');
});

test.serial('respondable', (t) => {
  t.plan(12 + Object.keys(breakpoints).length);

  const fakeCallback = () => {};

  // Verify state is empty
  t.deepEqual(state, { instances: {}, nextInstanceID: 0 });
  t.true(typeof respondable === 'function');

  // Checking argument validation
  t.throws(() => respondable(undefined, () => {}), 'Respondable requires an object as its first argument.');
  t.throws(() => respondable({}, undefined), 'Respondable requires a callback function as its second argument');
  t.throws(() => respondable({}, () => {}, {}), 'Respondable has an optional third parameter for matchMediaPolyFill of type function.');

  const respondableID = respondable(breakpoints, fakeCallback, matchMedia);

  // Respondable should return a number type ID that is a key for the new instance.
  t.true(typeof respondableID === 'number');
  t.truthy(state.instances[String(respondableID)]);
  const instance = state.instances[String(respondableID)];

  // The instance should have be an object and have a three properties.
  t.true(typeof instance === 'object');
  t.is(state.nextInstanceID, respondableID + 1);
  t.is(instance.onChangeCb, fakeCallback);
  t.true(typeof instance.listenerCb === 'function');
  t.true(Array.isArray(instance.queries));

  // instance.query is created by mapMediaQueryLists
  // Doing a basic test to confirm.
  for (const mockMQ of instance.queries) {
    t.is(breakpoints[mockMQ.query], mockMQ.value);
  }
});

test('destroyNext', (t) => {
  t.plan(5 + (Object.keys(breakpoints).length * 2));

  // Respondable should return a function. It is a wrapper for destroyNext
  t.true(typeof respondableNext === 'function');
  const destroyIt = respondableNext(breakpoints, () => {}, matchMedia);
  t.true(typeof destroyIt === 'function');

  /* eslint-disable no-unused-vars */
  let calledCount;
  let calledWith;
  /* eslint-disable no-unused-vars */

  // Mock an instance in state
  const queryChangeHandler = () => {};
  // Keep a reference to query property so we can test that listeners were destroyed
  const mockMQL = mapMediaQueryLists(breakpoints, queryChangeHandler, matchMedia);
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

  const successWrong = destroyNext();
  t.false(successWrong);

  const successCorrect = destroyNext(instance);
  t.true(successCorrect);

  // All MQ objects should have no listeners
  for (const mockMQ of mockMQL) {
    t.is(mockMQ.listeners.length, 0);
  }

  // All keys should be deleted
  t.is(Object.keys(instance).length, 0);
});

test.serial('respondable.destroy', (t) => {
  t.true(typeof destroy === 'function');

  // Respondable should export destroy unmodified and as a property of respondable
  t.is(respondable.destroy, destroy);

  // respondable should return a numeric ID tied to a instance in state.
  const respondableID = respondable(breakpoints, () => {}, matchMedia);
  t.true(typeof respondableID === 'number');
  t.true(typeof state.instances[respondableID] === 'object');

  // Should fail if not passed a valid ID
  const successWrong = destroy();
  t.false(successWrong);
  t.true(typeof state.instances[respondableID] === 'object');

  // Should delete instance if passed a valid ID
  const successCorrect = destroy(respondableID);
  t.true(successCorrect);
  t.true(typeof state.instances[respondableID] === 'undefined');
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
