const { exec } = require('child_process');
const js = require(jellyfinServerPluginLibRoot + '/js');

const JELLYFIN_DIR = '/opt/jellyfin';

function addSudo(cmd) {
  return`echo volumio | sudo -S ${cmd}`;
}

function execScript(arg) {
  return new Promise((resolve, reject) => {
    const cmd = `${JELLYFIN_DIR}/jellyfin.sh ${arg}`;
    js.getLogger().info(`[jellyfin-server] Executing Jellyfin script: ${cmd}`);
    exec(addSudo(cmd), { uid: 1000, gid: 1000 }, function (error, stdout, stderr) {
      if (error) {
        js.getLogger().error(js.getErrorMessage(`[jellyfin-server] Failed to execute ${cmd}: ${stderr.toString()}`, error));
        reject(error);
      } else {
        js.getLogger().info(`[jellyfin-server] Executed ${cmd}`);
        resolve(stdout.toString());
      }
    });
  });
}

function start() {
  return execScript('start');
};

function stop() {
  return execScript('stop');
}

function execDockerInfoTypeCmd(args) {
  const cmd = `docker ${args}`;
  js.getLogger().info(`[jellyfin-server] Executing Docker command: ${cmd}`);
  return new Promise((resolve, reject) => {
    exec(addSudo(cmd), { uid: 1000, gid: 1000 }, function (error, stdout, stderr) {
      if (error) {
        const errMsg = stderr.toString();
        js.getLogger().error(js.getErrorMessage(`[jellyfin-server] Error in ${cmd}: ${errMsg}`, error));
        resolve({
          error: true,
          message: errMsg
        });
      } else {
        try {
          resolve({
            error: false,
            data: JSON.parse(stdout.toString())
          });
        } catch (e) {
          js.getLogger().error(js.getErrorMessage(`[jellyfin-server] Error in parsing output of ${cmd}: `, e));
          resolve({
            error: true,
            message: js.getErrorMessage('', e, false)
          });
        }
      }
    });
  });
}

function inspect() {
  return execDockerInfoTypeCmd(`inspect -f '{{ json . }}' jellyfin`);
}

function stats() {
  return execDockerInfoTypeCmd(`stats --no-stream --format '{{ json . }}' jellyfin`);
}

function image() {
  return execDockerInfoTypeCmd(`images --format '{{ json . }}' jellyfin/jellyfin`);
}

async function df() {
  const df = await execDockerInfoTypeCmd(`system df -v --format '{{ json . }}'`);
  if (!df.error) {
    const data = df.data;
    const image = data.Images.find(image => image.Repository === 'jellyfin/jellyfin') || {};
    const container = data.Containers.find(container => container.Names === 'jellyfin') || {};
    const config = data.Volumes.find(volume => volume.Name === 'jellyfin-config') || {};
    const cache = data.Volumes.find(volume => volume.Name === 'jellyfin-cache') || {};
    return {
      error: false,
      data: {
        image,
        container,
        volumes: {
          config,
          cache
        }
      }
    };
  }
  else {
    return df;
  }
}


function isCgroupMemSupported() {
  return new Promise((resolve, reject) => {
    const cmd = `mount | grep cgroup | grep memory | wc -l`;
    exec(cmd, { uid: 1000, gid: 1000 }, function (error, stdout, stderr) {
      if (error) {
        const errMsg = stderr.toString();
        js.getLogger().error(js.getErrorMessage(`[jellyfin-server] Unable to determine if cgroup memory is supported: ${errMsg}`, error));
        resolve(false);
      } else {
        resolve(stdout.toString().trim() !== '0');
      }
    });
  });
}

async function summary() {
  try {
    const [_stats, _df, _image, cgroupMemSupported] = await Promise.all([stats(), df(), image(), isCgroupMemSupported()]);
    if (_stats.error || _df.error || _image.error) {
      return _stats.error ? _stats : _df.error ? _df : _image;
    }
    else {
      const dfData = _df.data;
      const statsData = _stats.data;
      const imageData = _image.data;
      const memStr = cgroupMemSupported ? 
        (statsData.MemUsage || '') + (statsData.MemPerc ? ` (${statsData.MemPerc})` : '') : 
        js.getI18n('JELLYFIN_SERVER_UNAVAILABLE');
      return {
        error: false,
        data: {
          version: imageData.Tag || '',
          status: dfData.container.Status || '',
          mem: memStr,
          cpu: statsData.CPUPerc || '',
          size: {
            base: dfData.image.Size || '',
            config: dfData.volumes.config.Size || '',
            cache: dfData.volumes.cache.Size || ''
          }
        }
      };
    }
  } catch (e) {
    return {
      error: true,
      message: js.getErrorMessage('', e, false)
    };
  }
}

module.exports = {
  start,
  stop,
  inspect,
  summary
};
