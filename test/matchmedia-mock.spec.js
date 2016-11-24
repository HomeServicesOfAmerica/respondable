import test from 'ava';
import matchMedia, { matchMediaState, updateSize, checkIfMatches } from './matchmedia-mock';

const makeCallCounter = () => {
  const callCounter = () => {
    callCounter.count += 1;
    return callCounter.count;
  };
  callCounter.count = 0;
  return callCounter;
};

test.beforeEach(() => {
  matchMediaState.size = '';
  matchMediaState.callbacks = [];
});

test('makeCallCounter', (t) => {
  t.plan(6);
  const callCounter = makeCallCounter();
  t.true(typeof makeCallCounter === 'function');
  t.true(typeof callCounter === 'function');
  t.true(typeof callCounter.count === 'number');
  t.is(callCounter.count, 0);
  t.is(callCounter(), 1);
  t.is(callCounter.count, 1);
});

test('checkIfMatches', (t) => {
  t.plan(8);
  t.true(typeof checkIfMatches === 'function');
  t.throws(checkIfMatches, 'checkIfMatches will only accept strings.');
  t.throws(() => checkIfMatches(true, []), 'checkIfMatches will only accept strings.');
  t.notThrows(() => checkIfMatches('query', 'size'));

  t.false(checkIfMatches('query', 'size'));
  t.false(checkIfMatches('query', 'biggerquery'));
  t.true(checkIfMatches('exactquery', 'exactquery'));
  t.true(checkIfMatches('endingquery', 'query'));
});

test('updateSize', (t) => {
  t.plan(5);
  t.true(typeof updateSize === 'function');

  const cb1 = makeCallCounter();
  const cb2 = makeCallCounter();
  const cb3 = makeCallCounter();
  const newSize = 'newSize';
  matchMediaState.callbacks.push(cb1, cb2, cb3);

  t.true([cb1, cb2, cb3].every(cb => cb.count === 0));
  t.is(matchMediaState.size, '');
  // Verify that callbacks are all being invoked when size changes.
  updateSize(newSize);
  t.is(matchMediaState.size, newSize);
  t.true([cb1, cb2, cb3].every(cb => cb.count === 1));
});

test('matchMediaState', (t) => {
  t.plan(4);
  t.true(typeof matchMediaState === 'object');
  t.is(matchMediaState.size, '');
  t.true(Array.isArray(matchMediaState.callbacks));
  t.true(matchMediaState.callbacks.every(cb => typeof cb === 'function'));
});

test('matchMedia', (t) => {
  t.plan(13);
  const mediaQuery = 'fakequery';
  t.true(typeof matchMedia === 'function');

  // Should return a mocked MediaQueryList
  const mockMQL = matchMedia(mediaQuery);
  t.true(typeof mockMQL === 'object');
  t.true(Array.isArray(mockMQL.listeners));
  t.true(typeof mockMQL.addListener === 'function');
  t.true(typeof mockMQL.removeListener === 'function');
  t.is(mockMQL.query, mediaQuery);

  // Should correctly manipulate listeners on each MediaQueryList
  const fakeHandler = () => {};
  mockMQL.addListener(fakeHandler);
  t.is(mockMQL.listeners.length, 1);
  t.is(mockMQL.listeners[0], fakeHandler);
  mockMQL.removeListener(fakeHandler);
  t.is(mockMQL.listeners.length, 0);

  // Should correctly set the matches property on the MQL
  t.false(mockMQL.matches);
  updateSize(mediaQuery);
  t.true(mockMQL.matches);
  updateSize('not a matching query');
  t.false(mockMQL.matches);
  updateSize('query');
  t.true(mockMQL.matches);
});
