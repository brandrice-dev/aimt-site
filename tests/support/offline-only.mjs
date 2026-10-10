import net from 'node:net';
import { syncBuiltinESMExports } from 'node:module';

// Loaded in every test process, including inherited Node child processes.
// Actual service calls are forbidden; injected mocks and fixture servers work.
const local = (host) => ['localhost', '127.0.0.1', '::1', '[::1]'].includes(String(host).toLowerCase());
const originalFetch = globalThis.fetch;
globalThis.fetch = async (input, init = {}) => {
  const url = new URL(typeof input === 'string' || input instanceof URL ? input : input.url);
  if (!local(url.hostname)) throw new Error('PR validation: external fetch blocked');
  return originalFetch(input, { ...init, redirect: 'error' });
};
const connect = net.Socket.prototype.connect;
net.Socket.prototype.connect = function (...args) {
  const normalized = Array.isArray(args[0]) ? args[0] : args;
  const first = normalized[0];
  const host = typeof first === 'object' ? first.host : typeof normalized[1] === 'string' ? normalized[1] : 'localhost';
  const unixPath = typeof first === 'object' && first.path;
  if (!unixPath && host && !local(host)) throw new Error('PR validation: external socket blocked');
  return connect.apply(this, args);
};
syncBuiltinESMExports();
