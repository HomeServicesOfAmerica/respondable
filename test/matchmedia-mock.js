// Mock matchMedia for testing purposes
export default function matchMedia(query) {
  const api = {
    addListener: function addListener(callback) {
      api.listeners = [...api.listeners, callback];
    },
    removeListener: function removeListener(callback) {
      const index = api.listeners.indexOf(callback);
      api.listeners = [...api.listeners.slice(0, index), ...api.listeners.slice(index + 1)];
    },
    query,
    listeners: [],
  };

  return api;
}
