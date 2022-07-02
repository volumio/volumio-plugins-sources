const { exec } = require('child_process');
const js = require(LMSDEPluginLibRoot + '/lmsde');

const OPT_DIR = '/opt/lmsde';
const OPT_MAIN_SCRIPT = 'lms.sh';
const DOCKER_CONTAINER_NAME = 'logitechmediaserver';

function addSudo(cmd) {
  return`echo volumio | sudo -S ${cmd}`;
}

function execScript(arg) {
  return new Promise((resolve, reject) => {
    const cmd = `${OPT_DIR}/${OPT_MAIN_SCRIPT} ${arg}`;
    js.getLogger().info(`[lmsde] Executing script: ${cmd}`);
    exec(addSudo(cmd), { uid: 1000, gid: 1000 }, function (error, stdout, stderr) {
      if (error) {
        js.getLogger().error(js.getErrorMessage(`[lmsde] Failed to execute ${cmd}: ${stderr.toString()}`, error));
        reject(error);
      } else {
        js.getLogger().info(`[lmsde] Executed ${cmd}`);
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
  js.getLogger().info(`[lmsde] Executing Docker command: ${cmd}`);
  return new Promise((resolve, reject) => {
    exec(addSudo(cmd), { uid: 1000, gid: 1000 }, function (error, stdout, stderr) {
      if (error) {
        const errMsg = stderr.toString();
        js.getLogger().error(js.getErrorMessage(`[lmsde] Error in ${cmd}: ${errMsg}`, error));
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
          js.getLogger().error(js.getErrorMessage(`[lmsde] Error in parsing output of ${cmd}: `, e));
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
  return execDockerInfoTypeCmd(`inspect -f '{{ json . }}' ${DOCKER_CONTAINER_NAME}`);
}

function stats() {
  return execDockerInfoTypeCmd(`stats --no-stream --format '{{ json . }}' ${DOCKER_CONTAINER_NAME}`);
}

async function image() {
  // Get name of Docker image belonging to the container identified by DOCKER_CONTAINER_NAME
  const imageName = await execDockerInfoTypeCmd(`container ls -a --filter 'name=${DOCKER_CONTAINER_NAME}' --format '{{ json .Image }}'`);
  if (imageName.error) {
    return imageName;
  }
  // Get info about the image
  return execDockerInfoTypeCmd(`images --format '{{ json . }}' ${imageName.data}`);
}

async function df() {
  const targetImage = await image();
  if (targetImage.error) {
    return targetImage;
  }
  const targetImageData = targetImage.data;
  const df = await execDockerInfoTypeCmd(`system df -v --format '{{ json . }}'`);
  if (!df.error) {
    const data = df.data;
    const image = data.Images.find(image => image.Repository === targetImageData.Repository && image.Tag === targetImageData.Tag) || {};
    const container = data.Containers.find(container => container.Names === DOCKER_CONTAINER_NAME) || {};
    const config = data.Volumes.find(volume => volume.Name === 'logitechmediaserver-config') || {};
    const playlist = data.Volumes.find(volume => volume.Name === 'logitechmediaserver-playlist') || {};
    return {
      error: false,
      data: {
        image,
        container,
        volumes: {
          config,
          playlist
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
        js.getLogger().error(js.getErrorMessage(`[lmsde] Unable to determine if cgroup memory is supported: ${errMsg}`, error));
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
        js.getI18n('LMSDE_UNAVAILABLE');
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
            playlist: dfData.volumes.playlist.Size || ''
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
