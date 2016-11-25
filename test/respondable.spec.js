/* eslint-disable no-console */
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
  WARN_INSTANCE_ALREADY_DESTROYED,
  WARN_EARLY_FIND_MATCHES_INVOKE,
  ERROR_INVALID_BREAKPOINT_CONFIG_TYPE,
  ERROR_INVALID_CALLBACK_TYPE,
  ERROR_INVALID_PRIORITY_TYPE,
  ERROR_MATCH_MEDIA_TYPE,
  ERROR_INVALID_PRIORITY_ARRAY_COMPOSITION,
} from '../src/respondable.js';
import respondableExport from '../src/index';

const breakpoints = {
  'screen and (max-width: 413px)': 'smallest',
  'screen and (min-width: 414px) and (max-width: 767px)': 'small',
  'screen and (min-width: 768px) and (max-width: 1079px)': 'medium',
  'screen and (min-width: 1080px) and (max-width: 1399px)': 'large',
  'screen and (min-width: 1400px)': 'largest',
};

const realWarn = console.warn;

test.beforeEach(() => {
  global.window = { matchMedia };
  console.warn = realWarn;
});

test('index.js', (t) => {
  t.plan(1);

  // Verify that respondable is being exported by index.js
  t.is(respondableExport, respondable);
});

test.serial('validateInput', (t) => {
  t.plan(18);

  global.window = undefined;
  // validateInput should be a function.
  t.true(typeof validateInput === 'function');

  // Checking argument validation
  t.throws(
    () => validateInput(undefined, () => {}),
    ERROR_INVALID_BREAKPOINT_CONFIG_TYPE
  );
  t.throws(
    () => validateInput(true, () => {}),
    ERROR_INVALID_BREAKPOINT_CONFIG_TYPE
  );
  t.throws(
    () => validateInput(3, () => {}),
    ERROR_INVALID_BREAKPOINT_CONFIG_TYPE
  );
  t.throws(
    () => validateInput({}, undefined),
    ERROR_INVALID_CALLBACK_TYPE
  );

  // If window is undefined throw error.
  t.throws(
    () => validateInput({}, () => {}),
    ERROR_MATCH_MEDIA_TYPE
  );

  // If window.matchMedia is undefined throw error.
  global.window = {};
  t.throws(
    () => validateInput({}, () => {}),
    ERROR_MATCH_MEDIA_TYPE
  );

  // If all arguments are correct and window.matchMedia is defined, don't throw error.
  global.window = { matchMedia };
  // TODO: Figure out why this doesn't work with validateInput
  t.notThrows(() => respondable({}, () => {}),
    ERROR_MATCH_MEDIA_TYPE
  );

  // If priority array doesn't consist of all breakpoint values without duplicates, throw error.
  const map = {
    query1: 'a',
    query2: 'b',
    query3: 'c',
  };
  const correctPriorities = [
    ['a', 'b'],
    ['c'],
    ['a', 'b', 'c'],
    ['b', 'c', 'a'],
  ];
  const wrongPriorities = [
    ['d'],
    ['a', 'a', 'a'],
    ['a', 'b', 'c', 'd'],
    ['a', 'b', 'c', 'a'],
  ];
  t.throws(
    () => validateInput(map, () => {}, true),
    ERROR_INVALID_PRIORITY_TYPE
  );

  // The following assertion doesn't throw `Respondable's third argument must be an array, if used.`
  t.notThrows(
    () => validateInput(map, () => {}, []),
    ERROR_INVALID_PRIORITY_TYPE
  );

  for (const wrongPriority of wrongPriorities) {
    t.throws(
      () => validateInput(map, () => {}, wrongPriority),
      ERROR_INVALID_PRIORITY_ARRAY_COMPOSITION
    );
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

  const destroyItPriority = respondable(
    overlappingBreakpoints, respondablePriorityCallback,
    ['largest', 'large', 'medium', 'small', 'smallest']
  );

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
  t.plan(6 + (Object.keys(breakpoints).length * 2));

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

  console.warn = spy();

  const successWrong = destroy();
  t.false(successWrong);
  t.true(console.warn.calledWith(WARN_INSTANCE_ALREADY_DESTROYED));
  t.is(console.warn.callCount, 1);

  const successCorrect = destroy(instance);
  t.true(successCorrect);
  t.is(console.warn.callCount, 1);

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
  t.plan(18);

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

  console.warn = spy();
  t.is(findMatches({}, []), undefined);
  t.true(console.warn.calledWith(WARN_EARLY_FIND_MATCHES_INVOKE));
  t.is(console.warn.callCount, 1);
  t.is(findMatches({ queries: true }, []), undefined);
  t.true(console.warn.calledWith(WARN_EARLY_FIND_MATCHES_INVOKE));
  t.is(console.warn.callCount, 2);

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
  t.plan(13);

  // createQueryChangeHandler should be a function
  t.true(typeof createQueryChangeHandler === 'function');

  // Setup mocks. findMatches is going to be returning true as a match for testing purposes.
  const mockFindMatches = spy(() => true);
  const mockInstance = { needsAKey: true };

  // createQueryChangeHandler should return a function and not invoke findMatches
  const handlerNoInstance = createQueryChangeHandler(mockFindMatches);
  const handlerWrongType = createQueryChangeHandler(mockFindMatches, true);
  const handlerEmptyInstance = createQueryChangeHandler(mockFindMatches, {});
  const handlerCorrect = createQueryChangeHandler(mockFindMatches, mockInstance, []);

  t.true(typeof handlerNoInstance === 'function');
  t.true(typeof handlerWrongType === 'function');
  t.true(typeof handlerEmptyInstance === 'function');
  t.true(typeof handlerCorrect === 'function');

  // the queryChangeHandler should not call findMatches if there is no instance
  t.true(handlerNoInstance() === undefined);
  t.is(mockFindMatches.callCount, 0);

  t.true(handlerWrongType() === undefined);
  t.is(mockFindMatches.callCount, 0);

  t.true(handlerEmptyInstance() === undefined);
  t.is(mockFindMatches.callCount, 0);

  // If given the correct parameters, createQueryChangeHandler should return findMatch's result
  t.true(handlerCorrect());
  t.is(mockFindMatches.callCount, 1);
});
