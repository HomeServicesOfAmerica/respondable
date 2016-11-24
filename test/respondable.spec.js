import test from 'ava';
import matchMedia, { updateSize } from './matchmedia-mock';
import {
  destroy,
  respondable,
  findMatches,
  createQueryChangeHandler,
  mapMediaQueryLists,
  validateInput,
} from '../src/respondable.js';

import respondableExport from '../src/index';

// TODO Could test overlappingBreakpoints in all test suites

const breakpoints = {
  'screen and (max-width: 413px)': 'smallest',
  'screen and (min-width: 414px) and (max-width: 767px)': 'small',
  'screen and (min-width: 768px) and (max-width: 1079px)': 'medium',
  'screen and (min-width: 1080px) and (max-width: 1399px)': 'large',
  'screen and (min-width: 1400px)': 'largest',
};

test.beforeEach(() => {
  global.window = { matchMedia };
});

test('index.js', (t) => {
  t.plan(1);

  // Verify that respondable is being exported by index.js
  t.is(respondableExport, respondable);
});

test.serial('validateInput', (t) => {
  t.plan(13);

  global.window = undefined;
  // validateInput should be a function.
  t.true(typeof validateInput === 'function');

  // Checking argument validation
  t.throws(() => validateInput(undefined, () => {}), 'Respondable requires an object as its first argument.');
  t.throws(() => validateInput({}, undefined), 'Respondable requires a callback function as its second argument');

  // If window is undefined throw error.
  t.throws(() => validateInput({}, () => {}), 'Respondable is dependent on window.matchMedia. Please use a polyfill if matchMedia is not supported in this browser.');

  // If window.matchMedia is undefined throw error.
  global.window = {};
  t.throws(() => validateInput({}, () => {}), 'Respondable is dependent on window.matchMedia. Please use a polyfill if matchMedia is not supported in this browser.');

  // If all arguments are correct and window.matchMedia is defined, don't throw error.
  global.window = { matchMedia };
  // TODO: Figure out why this doesn't work with validateInput
  t.notThrows(() => respondable({}, () => {}), 'Respondable is dependent on window.matchMedia. Please use a polyfill if matchMedia is not supported in this browser.');

  // If priority array doesn't consist of all breakpoint values without duplicates, throw error.
  const map = {
    query1: 'a',
    query2: 'b',
    query3: 'c',
  };
  const correctPriorities = [
    ['a', 'b', 'c'],
    ['b', 'c', 'a'],
  ];
  const wrongPriorities = [
    ['a', 'b'],
    ['a', 'a', 'a'],
    ['a', 'b', 'c', 'd'],
  ];
  t.throws(() => validateInput(map, () => {}, true), `Respondable's third argument must be an array, if used.`);

  // The following assertion doesn't throw `Respondable's third argument must be an array, if used.`
  t.notThrows(() => validateInput(map, () => {}, []), `Respondable's third argument must be an array, if used.`);

  for (const wrongPriority of wrongPriorities) {
    t.throws(() => validateInput(map, () => {}, wrongPriority), `The priority array's values didn't correspond to the values of the breakpoint map.`);
  }

  for (const correctPriority of correctPriorities) {
    t.notThrows(() => validateInput(map, () => {}, correctPriority));
  }
});

test('respondable', (t) => {
  // Respondable should be a function.
  t.true(typeof respondable === 'function');

  /* eslint-disable no-unused-vars */
  let calledCount = 0;
  let calledWith = null;
  /* eslint-enable no-unused-vars */

  const respondableCallback = (active, largest) => {
    calledCount += 1;
    calledWith = [active, largest];
  };

  // Set initial size.
  updateSize('screen and (max-width: 413px)');

  // updateSize shouldn't call callback.
  t.is(calledCount, 0);
  t.is(calledWith, null);

  // Respondable should return a destroy function.
  const destroyIt = respondable(breakpoints, respondableCallback);
  t.true(typeof destroyIt === 'function');
  t.true(String(destroyIt).includes('destroy('));

  // Initial active values should be passed into callback.
  t.is(calledCount, 1);
  t.deepEqual(calledWith, [['smallest'], undefined]);

  // Changing size should retrigger callback and pass in accurate data.
  updateSize('screen and (min-width: 1080px) and (max-width: 1399px)');
  t.is(calledCount, 2);
  t.deepEqual(calledWith, [['large'], undefined]);

  // Destroying the instance should not throw an error and should prevent future updates
  t.notThrows(destroyIt);
  updateSize('doesn\'t matter');
  t.is(calledCount, 2);
  t.deepEqual(calledWith, [['large'], undefined]);

  // This is obviously not a correct breakpoint config, but this was a quick way to test
  // multiple matching queryies
  const overlappingBreakpoints = {
    '(max-width: 413px)': 'smallest',
    'screen and (max-width: 413px)': 'small',
    'screen and otherthing and (max-width: 413px)': 'medium',
    'screen and (max-width: 1399px)': 'large',
    'screen and (min-width: 1400px)': 'largest',
  };

  // Should only match small
  updateSize('screen and (max-width: 413px)');

  calledCount = 0;
  calledWith = null;

  const destroyItPriority = respondable(overlappingBreakpoints, respondableCallback, ['largest', 'large', 'medium', 'small', 'smallest']);

  // Initial active values should be passed into callback.
  t.is(calledCount, 1);
  t.deepEqual(calledWith, [['small'], 'small']);

  // Should match smallest, small, and medium
  updateSize('(max-width: 413px)');
  // 4 because it triggered 3 listeners (3 matches)
  t.is(calledCount, 4);
  t.deepEqual(calledWith, [['smallest', 'small', 'medium'], 'medium']);

  // Destroying the instance should not throw an error and should prevent future updates
  t.notThrows(destroyItPriority);
  updateSize('doesn\'t matter');
  t.is(calledCount, 4);
  t.deepEqual(calledWith, [['smallest', 'small', 'medium'], 'medium']);
});

test('destroy', (t) => {
  t.plan(3 + (Object.keys(breakpoints).length * 2));

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

  // Mock queryChangeHandler
  const queryChangeHandler = () => {};

  // mapMediaQueryLists should be a function
  t.true(typeof mapMediaQueryLists === 'function');

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
  t.plan(14);

  // findMatches should be a function
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
  const matchingValues = findMatches(instance, []);
  t.is(calledCount, 1);
  t.true(Array.isArray(matchingValues.matches));
  t.true(typeof matchingValues.priority === 'undefined');

  // The array should contain the values of query items that have matches set to true.
  t.deepEqual(['bob', 'alice'], matchingValues.matches);

  // onChangeCb should be passed the same object that was returned.
  t.is(calledWith[0], matchingValues.matches);
  t.is(calledWith[1], matchingValues.priority);


  const matchingValuesPriority = findMatches(instance, ['alice', 'bob']);
  t.is(calledCount, 2);
  t.true(Array.isArray(matchingValuesPriority.matches));
  t.true(typeof matchingValuesPriority.priority === 'string');

  // The array should contain the values of query items that have matches set to true.
  t.is('alice', matchingValuesPriority.priority);

  // onChangeCb should be passed the same object that was returned.
  t.is(calledWith[0], matchingValuesPriority.matches);
  t.is(calledWith[1], matchingValuesPriority.priority);
});

test('createQueryChangeHandler', (t) => {
  t.plan(9);

  // createQueryChangeHandler should be a function
  t.true(typeof createQueryChangeHandler === 'function');

  // Setup
  let calledCount = 0;
  const mockFindMatches = () => {
    calledCount += 1;
    return true;
  };
  const mockInstance = { needsAKey: true };

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
  const handlerCorrect = createQueryChangeHandler(mockFindMatches, mockInstance, []);
  t.true(typeof handlerCorrect === 'function');
  t.is(calledCount, 0);
  t.true(handlerCorrect());
  t.is(calledCount, 1);
});
