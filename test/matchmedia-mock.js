// Mock matchMedia for testing purposes

// Returns true if the two strings match or the query ends with the size
// Used for testing breakpoints that match multiple
export function checkIfMatches(query, size) {
  if (typeof query !== 'string' || typeof size !== 'string') {
    throw new Error('checkIfMatches will only accept strings.');
  }
  return size.length > 0 && query.endsWith(size);
}

export const matchMediaState = {
  size: '',
  callbacks: [],
};

export function updateSize(newSize) {
  matchMediaState.size = newSize;
  for (const cb of matchMediaState.callbacks) {
    cb(newSize);
  }
}

export default function matchMedia(query) {
  const api = {
    addListener: function addListener(callback) {
      api.listeners = [...api.listeners, callback];
      matchMediaState.callbacks.push((newSize) => {
        api.matches = checkIfMatches(query, newSize);
        if (api.matches) callback({ matches: api.matches });
      });
    },
    removeListener: function removeListener(callback) {
      const index = api.listeners.indexOf(callback);
      api.listeners = [...api.listeners.slice(0, index), ...api.listeners.slice(index + 1)];
    },
    query,
    listeners: [],
    matches: checkIfMatches(query, matchMediaState.size),
  };

  return api;
}
