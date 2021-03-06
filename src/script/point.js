/**
 * Created by Godfery on 2016/9/5 0005.
 */

require('colors');
const glob = require('glob');
const Path = require('path');
const fse = require('fs-extra');
const fs = require('fs');
const async = require('async');
const color = require('./util/color');

const rootPath = Path.join(__dirname, '../lib');
const baseColor = '#00bcd4';

/**
 * 导入资源
 * @param {Object} options
 * @param {String []} paths
 * @param {String} dist
 */
function importResources({ paths = [], dist = '', needDirPath = true } = {}, doneCallback) {
  try {
    if (dist.length === 0) {
      throw  'ERROR: [option.dist] is required';
    }
  } catch (e) {
    console.log(e.red);
    process.env.exit(0);
  }
  console.log('ImportResources ...');
  /**
   * 获取全部文件的路径
   * @param paths
   * @param callback
   */
  const getPathsAllFiles = (paths, callback) => {
    let allFiles = [];
    const absolutePaths = paths.map(path => Path.join(rootPath, path));
    async.eachLimit(absolutePaths, 1, (path, next) => {
      glob(path, {}, (err, files) => {
        if (err) {
          console.log(err);
        } else {
          allFiles = [...allFiles, ...files];
        }
        next();
      });
    }, () => callback && callback(allFiles));
  }

  /**
   * 复制文件
   * @param files
   * @param callback
   */
  const copyFiles = (files, callback) => {
    async.eachLimit(files, 1, (filePath, next) => {
      const outputPath = needDirPath ? Path.relative(rootPath, filePath) : Path.basename(filePath);
      console.log(`Copy ${outputPath}`);
      fse.copy(filePath, Path.join(dist, outputPath), function (err) {
        if (err) {
          console.error(err);
        }
        next();
      });
    }, () => {
      callback && callback();
      doneCallback && doneCallback();
    });
  }

  getPathsAllFiles(paths, file => copyFiles(file, () => {
    console.log('ImportResources ' + '[SUCCESS]'.green);
  }));

  return module.exports;
};

/**
 * 画板方法
 * @param {Object} options
 */
function palette({ baseColor: themeColor = baseColor, src = 'css/rsuite.min.css', dist } = {}, doneCallback) {

  try {
    if (!dist) {
      throw  `ERROR: [option.dist] is required`;
    }
  } catch (e) {
    console.log(e.red);
    return;
  }

  const originColors = color.calcColors(baseColor);
  const themeColors = color.calcColors(themeColor);
  const distPath = Path.dirname(dist);

  const ensureDir = path => new Promise((resolve) => {
    fse.ensureDir(path, () => resolve());
  });

  const readData = path => new Promise(resolve => {
    fs.readFile(path, 'utf-8', (err, data) => {
      resolve(data || '');
    });
  });

  const writeData = (path, data) => new Promise((resolve, reject) => {
    fs.writeFile(path, data, (err) => {
      if (err) {
        reject(err);
      }
      resolve();
    });
  });

  const handleCallback = (...args) => doneCallback && doneCallback(args);

  const generateThemes = async function () {
    try {
      await ensureDir(distPath);
      let data = await readData(Path.join(rootPath, src));
      originColors.forEach((color, index) => {
        data = data.replace(new RegExp(color, 'g'), themeColors[index]);
      });
      await  writeData(dist, data);
      console.log(`Palette ${dist}` + '[SUCCESS]'.green);
      handleCallback();
    } catch (e) {
      console.log(`Palette ${dist}` + '[FAILD]'.red);
      handleCallback(e);
    }
  };

  generateThemes();

  return module.exports;
}

module.exports = {
  importResources,
  palette
};
