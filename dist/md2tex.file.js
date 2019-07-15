#!/usr/bin/env node
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.convertFile = void 0;

var _fs = _interopRequireDefault(require("fs"));

var _path = _interopRequireDefault(require("path"));

var _logger = _interopRequireDefault(require("./logger"));

var _md2tex = _interopRequireDefault(require("./md2tex"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const logger = (0, _logger.default)();

const readFile = filename => {
  return new Promise((resolve, reject) => {
    _fs.default.readFile(filename, "utf8", function (err, data) {
      err ? logger.error(err) : logger.log("The file was read.");
      return err ? reject(err) : resolve(data);
    });
  });
};

const writeFile = (filepath, content) => {
  return new Promise((resolve, reject) => {
    if (!_fs.default.existsSync(_path.default.dirname(filepath))) {
      _fs.default.mkdirSync(_path.default.dirname(filepath), {
        recursive: true
      });
    }

    _fs.default.writeFile(filepath, content, function (err) {
      err ? logger.error(err) : logger.log("The file was saved.");
      return err ? reject(err) : resolve();
    });
  });
};

const readFilelist = (dir, filelist = [], baseDir) => {
  if (!baseDir) {
    baseDir = dir;
  }

  _fs.default.readdirSync(dir).forEach(file => {
    filelist = _fs.default.statSync(_path.default.join(dir, file)).isDirectory() ? readFilelist(_path.default.join(dir, file), filelist, baseDir) : filelist.concat(_path.default.relative(baseDir, _path.default.join(dir, file)));
  });

  return filelist;
};

const convertFile = async (filenameIn, filenameOut) => {
  filenameIn;
  const content = await readFile(filenameIn || "./in.md");
  const output = (0, _md2tex.default)(content);
  writeFile(filenameOut || "./out.tex", output);
};

exports.convertFile = convertFile;
const inPath = process.argv[2] || "./in.md";
const outPath = process.argv[3] || "./out.md";
console.log(`Convert from "${inPath}" to "${outPath}"\n...`);

if (_fs.default.statSync(inPath).isDirectory()) {
  if (_fs.default.existsSync(outPath) && !_fs.default.statSync(outPath).isDirectory()) {
    logger.error("Output Path is not a directory");
  }

  readFilelist(inPath).forEach(relPath => {
    if (!/\.md$/i.test(relPath)) {
      // skip non md files
      return;
    }

    convertFile(_path.default.join(inPath, relPath), _path.default.join(outPath, relPath).replace(".md", ".tex"));
  });
} else {
  if (_fs.default.existsSync(outPath) && _fs.default.statSync(outPath).isDirectory()) {
    logger.error("Output Path is not a file");
  }

  convertFile(inPath, outPath);
}

console.log(`Conversion finished :D`);
