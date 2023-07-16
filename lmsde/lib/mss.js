const fs = require('fs');

// Music Services Shield plugin-related functions

const ROOT_CPUSET_PATH = '/sys/fs/cgroup/cpuset/'
const SYSTEM_CPUSET_PATH = '/sys/fs/cgroup/cpuset/system'

function resolveOnShieldCreated(timeout = 15000) {
  if (fs.existsSync(SYSTEM_CPUSET_PATH)) {
    return Promise.resolve({
      status: 'created'
    });
  }

  return new Promise((resolve, reject) => {
    let fsWatcher = null;

    const timer = setTimeout(() => {
      if (fsWatcher) {
        fsWatcher.close();
      }
      resolve({
        status: 'timeout'
      });
    }, timeout);

    try {
      fsWatcher = fs.watch(ROOT_CPUSET_PATH, (event, filename) => {
          if (event === 'rename' && (ROOT_CPUSET_PATH + filename) === SYSTEM_CPUSET_PATH && fs.existsSync(SYSTEM_CPUSET_PATH)) {
            clearTimeout(timer);
            fsWatcher.close();
            resolve({
              status: 'created'
            });
          }
      });
    } catch (error) {
      if (fsWatcher) {
        fsWatcher.close();
      }
      reject(error);
    }
  });
}

module.exports = {
  resolveOnShieldCreated
};
