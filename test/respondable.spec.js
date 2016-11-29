import test from 'ava';
import { spy } from 'sinon';
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
  t.plan(15);

  global.window = undefined;
  // validateInput should be a function.
  t.true(typeof validateInput === 'function');

  // Checking argument validation
  t.throws(() => validateInput(undefined, () => {}), 'Respondable requires an object as its first argument.');
  t.throws(() => validateInput(true, () => {}), 'Respondable requires an object as its first argument.');
  t.throws(() => validateInput(3, () => {}), 'Respondable requires an object as its first argument.');
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

  const respondableCallback = spy();

  // Set initial size.
  updateSize('screen and (max-width: 413px)');

  // updateSize shouldn't call callback.
  t.is(respondableCallback.callCount, 0);

  // Respondable should return a destroy function.
  const destroyIt = respondable(breakpoints, respondableCallback);
  t.true(typeof destroyIt === 'function');
  t.true(String(destroyIt).includes('destroy('));

  // Initial active values should be passed into callback.
  t.is(respondableCallback.callCount, 1);
  t.true(respondableCallback.calledWith(['smallest'], undefined));

  // Changing size should retrigger callback and pass in accurate data.
  updateSize('screen and (min-width: 1080px) and (max-width: 1399px)');
  t.is(respondableCallback.callCount, 2);
  t.true(respondableCallback.calledWith(['large'], undefined));

  // Destroying the instance should not throw an error and should prevent future updates
  t.notThrows(destroyIt);
  updateSize('doesn\'t matter');
  t.is(respondableCallback.callCount, 2);
  t.true(respondableCallback.calledWith(['large'], undefined));

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

  const respondablePriorityCallback = spy();

  const destroyItPriority = respondable(overlappingBreakpoints, respondablePriorityCallback, ['largest', 'large', 'medium', 'small', 'smallest']);

  // Initial active values should be passed into callback.
  t.is(respondablePriorityCallback.callCount, 1);
  t.true(respondablePriorityCallback.calledWith(['small'], 'small'));

  // Should match smallest, small, and medium
  updateSize('(max-width: 413px)');
  // 4 because it triggered 3 listeners (3 matches)
  t.is(respondablePriorityCallback.callCount, 4);
  t.true(respondablePriorityCallback.calledWith(['smallest', 'small', 'medium'], 'medium'));

  // Destroying the instance should not throw an error and should prevent future updates
  t.notThrows(destroyItPriority);
  updateSize('doesn\'t matter');
  t.is(respondablePriorityCallback.callCount, 4);
  t.true(respondablePriorityCallback.calledWith(['smallest', 'small', 'medium'], 'medium'));
});

test('destroy', (t) => {
  t.plan(3 + (Object.keys(breakpoints).length * 2));

  // Mock the query change handler
  const queryChangeHandler = () => {};

  // Keep a reference to query property so we can test that listeners were destroyed
  const mockMQL = mapMediaQueryLists(breakpoints, queryChangeHandler, matchMedia);

  // Mock an instance in state
  const instance = {
    queries: mockMQL,
    onChangeCb: () => {},
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
  t.plan(12);

  // findMatches should be a function
  t.true(typeof findMatches === 'function');

  // initialize instance and onChangeCb spies
  const instance = {
    queries: [
      { matches: true, value: 'bob' },
      { matches: true, value: 'alice' },
      { matches: false, value: 'frank' },
    ],
    onChangeCb: spy(),
  };

  // Given the correct parameters, findMatches should return an array.
  t.is(instance.onChangeCb.callCount, 0);
  const matches = findMatches(instance, []);
  t.is(instance.onChangeCb.callCount, 1);
  t.true(Array.isArray(matches.matches));
  t.true(typeof matches.priority === 'undefined');

  // The array should contain the values of query items that have matches set to true.
  t.deepEqual(['bob', 'alice'], matches.matches);

  // onChangeCb should be passed the same values that were returned.
  t.true(instance.onChangeCb.calledWith(matches.matches, matches.priority));


  const matchesPriority = findMatches(instance, ['alice', 'bob']);
  t.is(instance.onChangeCb.callCount, 2);
  t.true(Array.isArray(matchesPriority.matches));
  t.true(typeof matchesPriority.priority === 'string');

  // The array should contain the values of query items that have matches set to true.
  t.is('alice', matchesPriority.priority);

  // onChangeCb should be passed the same values that were returned.
  t.true(instance.onChangeCb.calledWith(matchesPriority.matches, matchesPriority.priority));
});

test('createQueryChangeHandler', (t) => {
  t.plan(9);

  // createQueryChangeHandler should be a function
  t.true(typeof createQueryChangeHandler === 'function');

  // Setup mocks. findMatches is going to be returning true as a match for testing purposes.
  const mockFindMatches = spy(() => true);
  const mockInstance = { needsAKey: true };

  // createQueryChangeHandler should return a function and not call findMatches
  const handlerWrong = createQueryChangeHandler(mockFindMatches);
  t.true(typeof handlerWrong === 'function');
  t.is(mockFindMatches.callCount, 0);

  // If createQueryChangeHandler is not passed an instance,
  // findMatches should not be invoked
  t.is(handlerWrong(), undefined);
  t.is(mockFindMatches.callCount, 0);

  // If given the correct parameters, createQueryChangeHandler should invoke
  // findMatches and return the result.
  const handlerCorrect = createQueryChangeHandler(mockFindMatches, mockInstance, []);
  t.true(typeof handlerCorrect === 'function');
  t.is(mockFindMatches.callCount, 0);
  t.true(handlerCorrect());
  t.is(mockFindMatches.callCount, 1);
});
