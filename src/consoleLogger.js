/**
 * consoleLogger.js
 * Intercepts console.log / warn / error and keeps them in memory
 * so they can be displayed in the in-app console panel.
 *
 * Works in production APKs — no adb / Metro required.
 */

const MAX_LOGS = 300; // keep at most this many entries

let logs = [];
let listeners = [];

const _original = {
  log: console.log.bind(console),
  warn: console.warn.bind(console),
  error: console.error.bind(console),
  info: console.info.bind(console),
};

let installed = false;

function formatArgs(args) {
  return args
    .map((a) => {
      if (a === null) return 'null';
      if (a === undefined) return 'undefined';
      if (typeof a === 'object') {
        try {
          return JSON.stringify(a, null, 2);
        } catch {
          return String(a);
        }
      }
      return String(a);
    })
    .join(' ');
}

function push(level, args) {
  const entry = {
    id: Date.now() + Math.random(),
    level,          // 'log' | 'warn' | 'error' | 'info'
    message: formatArgs(args),
    time: new Date().toTimeString().slice(0, 8), // HH:MM:SS
  };

  logs = [entry, ...logs].slice(0, MAX_LOGS); // newest first
  listeners.forEach((fn) => fn([...logs]));
}

export function installConsoleInterceptor() {
  if (installed) return;
  installed = true;

  console.log = (...args) => { _original.log(...args); push('log', args); };
  console.warn = (...args) => { _original.warn(...args); push('warn', args); };
  console.error = (...args) => { _original.error(...args); push('error', args); };
  console.info = (...args) => { _original.info(...args); push('info', args); };
}

export function uninstallConsoleInterceptor() {
  if (!installed) return;
  console.log = _original.log;
  console.warn = _original.warn;
  console.error = _original.error;
  console.info = _original.info;
  installed = false;
}

/** Subscribe to log changes. Returns an unsubscribe function. */
export function subscribeToLogs(fn) {
  listeners.push(fn);
  fn([...logs]); // immediately emit current state
  return () => {
    listeners = listeners.filter((l) => l !== fn);
  };
}

/** Get current logs snapshot */
export function getLogs() {
  return [...logs];
}

/** Clear all stored logs */
export function clearLogs() {
  logs = [];
  listeners.forEach((fn) => fn([]));
}
