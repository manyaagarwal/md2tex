#!/usr/bin/env node
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.convertFile = void 0;

var _fs = _interopRequireDefault(require("fs"));

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
    _fs.default.writeFile(filepath, content, function (err) {
      err ? logger.error(err) : logger.log("The file was saved.");
      return err ? reject(err) : resolve();
    });
  });
};

const convertFile = async (filenameIn, filenameOut) => {
  filenameIn;
  const content = await readFile(filenameIn || "./in.md");
  const output = (0, _md2tex.default)(content);
  writeFile(filenameOut || "./out.tex", output);
};

exports.convertFile = convertFile;
const inFile = process.argv[2] || "./in.md";
const outFile = process.argv[3] || "./out.md";
console.log(`Convert file: ${inFile} to ${outFile}...`);
convertFile(inFile, outFile);
console.log(`Conversion finished :D`);
