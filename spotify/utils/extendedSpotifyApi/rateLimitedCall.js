const COOLDOWN_PERIOD = 10000;
const MAX_ATTEMPTS = 10;

let isCooldown = false;
let timeoutRef = null;

function cooldown() {
  clearTimeout(timeoutRef);
  isCooldown = true;
  timeoutRef = setTimeout(() => {
    isCooldown = false;
  }, COOLDOWN_PERIOD);
}

function waitForCooldown() {
  return new Promise((resolve) => {
    if (!isCooldown) {
      resolve();
      return;
    }
    const int = setInterval(() => {
      if (!isCooldown) {
        clearInterval(int);
        resolve();
      }
    }, 1000);
  });
}

function call(api, method, { logger, args, attempt } = {}) {
  if (attempt > MAX_ATTEMPTS) {
    return Promise.reject(new Error(`Giving up API request ${method} after ${MAX_ATTEMPTS} attempts`));
  }

  return new Promise(async (resolve, reject) => {
    try {
      await waitForCooldown();
      const data = await api[method](...args);
      resolve(data);
    } catch (e) {
      if (e.statusCode === 429) {
        logger.warn(
          `Spotify API method ${method} failed due to "Too many requests". Stop all API requests for ${COOLDOWN_PERIOD} milliseconds.`
        );
        cooldown();
        call(api, method, { logger, args, attempt: attempt + 1 })
          .then((x) => resolve(x))
          .catch((x) => reject(x));
        return;
      }
      reject(new Error(`Spotify API method ${method} failed: ${e}`));
    }
  });
}

module.exports.rateLimitedCall = call;
