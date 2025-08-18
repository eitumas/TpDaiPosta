import { AsyncLocalStorage } from 'node:async_hooks';

const asyncLocalStorage = new AsyncLocalStorage();

function getContext() {
  return asyncLocalStorage.getStore() || {};
}

function setContextValue(key, value) {
  const store = asyncLocalStorage.getStore();
  if (store) {
    store[key] = value;
  }
}

function runWithContext(initialContext, callback) {
  return asyncLocalStorage.run(initialContext, callback);
}

export { getContext, setContextValue, runWithContext };
export default asyncLocalStorage;


