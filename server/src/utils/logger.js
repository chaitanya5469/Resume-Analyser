const levels = ['debug', 'info', 'warn', 'error'];

function write(level, message, meta = {}) {
  const payload = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...meta,
  };

  const log = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
  log(JSON.stringify(payload));
}

export const logger = Object.fromEntries(
  levels.map((level) => [level, (message, meta) => write(level, message, meta)])
);
