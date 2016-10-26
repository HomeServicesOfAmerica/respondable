import test from 'ava';
import matchMedia from './matchmedia-mock';

test('matchMedia polyfill for testing', (t) => {
  t.plan(9);
  const mediaQuery = 'fakequery';
  t.is(typeof matchMedia, 'function');

  // Should return a mocked MediaQueryList
  const mockMQL = matchMedia(mediaQuery);
  t.is(typeof mockMQL, 'object');
  t.is(Array.isArray(mockMQL.listeners), true);
  t.is(typeof mockMQL.addListener, 'function');
  t.is(typeof mockMQL.removeListener, 'function');
  t.is(mockMQL.query, mediaQuery);

  // Should correctly manipulate listeners on each MediaQueryList
  const fakeHandler = () => {};
  mockMQL.addListener(fakeHandler);
  t.is(mockMQL.listeners.length, 1);
  t.is(mockMQL.listeners[0], fakeHandler);
  mockMQL.removeListener(fakeHandler);
  t.is(mockMQL.listeners.length, 0);
});
