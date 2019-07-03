#!/usr/bin/env node
"use strict";
"use-strict"; // Copyright (C) 2019 Adrian Jost
// This code is licensed under MIT license (see https://tldrlegal.com/license/mit-license for details)

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.convert = void 0;

var _dedentTabs = _interopRequireDefault(require("dedent-tabs"));

var _logger = _interopRequireDefault(require("./logger"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

let logger = (0, _logger.default)();

const escapeSpecialChars = text => {
  const prefix = char => `\\${char}`;

  text = text.replace(/([\~])/g, "\\textasciitilde ");
  text = text.replace(/([\^])/g, "\\textasciicircum ");
  text = text.replace(/([\\])/g, "\\textbackslash ");
  text = text.replace(/([\&\%\$\#\_\{\}])/g, prefix);
  return text;
};

const removeSpecialChars = text => text.replace(/([\&\%\$\#\_\{\}\~\^\\])/g, "");

const mapHeadlines = (line, index) => {
  let content = line.replace(/^[#]+\W/, "");
  const text = mapInlineTextStyles(content);
  const identifier = `${index}-` + removeSpecialChars(content.toLowerCase()).replace(/\W/g, "-");
  const level = line.match(/^[#]+/g)[0].length;

  switch (level) {
    case 1:
      return `%************************************************\n\\chapter{${text}}\n\\label{ch:${identifier}}\n%************************************************`;

    case 2:
      return `\\hypertarget{${identifier}}{\n\\section{${text}}\\label{${identifier}}}`;

    case 3:
      return `\\hypertarget{${identifier}}{\n\\subsection{${text}}\\label{${identifier}}}`;

    case 4:
      return `\\hypertarget{${identifier}}{\n\\subsubsection{${text}}\\label{${identifier}}}`;

    case 5:
      return `\\hypertarget{${identifier}}{\n\\paragraph{${text}}\\label{${identifier}}}`;

    case 6:
      return `\\hypertarget{${identifier}}{\n\\subparagraph{${text}}\\label{${identifier}}}`;

    default:
      logger.error(`unsupported heading ${index}: "${line}"`);
      return line;
  }
};

const mapCodeblocks = (line, index) => {
  if (!line.startsWith("```")) {
    return line;
  }

  if (line.trim() === "```") {
    return `	\\end{minted}
	\\caption{Code SnippeCode Snipped ${index}}
	\\label{lst:code-snipped-${index}}
\\end{listing}`;
  }

  const language = line.slice(3).trim().toLowerCase();
  return `\\begin{listing}[H]
	\\begin{minted}{${language}}`;
};

const mapInlineCodeblocks = line => {
  const inlineCode = function () {
    const args = Array.from(arguments);
    return `\\colorbox{gray-light!}{\\texttt{${escapeSpecialChars(args[1])}}}`;
  };

  return line.replace(/\`([^\`]*)\`/g, inlineCode);
};

const mapTextStyle = line => {
  const replaceWithUnescapedMatch = newString => function (match) {
    let out = newString;
    Array.from(arguments).forEach((a, i) => {
      // mimic .replace api
      if (typeof a !== "string") {
        return;
      } // unescape


      const unescaped = a.replace(/\\([\*\_\\])/g, "$1");
      out = out.replace(`$${i}`, unescaped);
    });
    return out;
  }; // 1. escape all _ and * inside urls
  // https://regex101.com/r/TJ2xDV/3


  line = line.replace(/(?<=[^\!]\[.*\]\(.*)([\\\_\*])(?=.*\))/g, "\\$1"); // 2. apply bold when not escaped. then unescape the text

  line = line // check regex for single character below for details
  .replace(/(?<=(?:^|[^\\])(?:\\\\)*)(?<!\!\[.*\].*)(\*\*|\_\_)((?:[^\\]|\\[^\\]|\\\\)*?)\1/g, replaceWithUnescapedMatch("\\textbf{$2}")); // 2. apply italic when not escaped. then unescape the text

  line = line // https://regex101.com/r/jocMku/2
  .replace(/(?<=(?:^|[^\\])(?:\\\\)*)(?<!\!\[.*\].*)(\*|\_)((?:[^\\]|\\[^\\]|\\\\)*?)\1/g, replaceWithUnescapedMatch("\\textit{$2}"));
  return line;
};

const mapImages = line => {
  const replaceImage = function (match) {
    const args = Array.from(arguments);
    return `\n\\begin{figure}[H]
	\\centering
	\\includegraphics[width=\\textwidth]{${args[2]}}
	\\caption[${removeSpecialChars(args[1])}]{${removeSpecialChars(args[1])}}
	\\label{fig:${removeSpecialChars(args[1])}}
\\end{figure}\n`;
  };

  return line.replace(/\!\[([^\]]*)\]\(([^\)]+)\)/g, replaceImage);
};

const mapFootnotes = line => {
  const footnote = ` $1\\footnote{$2}`;
  return line.replace(/[^\!]\[([^\]]*)\]\(([^\)]+)\)/g, footnote);
};

const mapInlineTextStyles = (line, index) => {
  line = mapTextStyle(line);
  line = mapInlineCodeblocks(line, index);
  line = mapFootnotes(line);
  return line;
};

const convert = (content, {
  loglevel = "warn"
} = {}) => {
  logger = (0, _logger.default)(loglevel);
  content = content + "\n".repeat(2);
  let inRawLatexBlock = false;
  let inCodeBlock = false;
  let openEnums = [];
  const enums = [[/^(\s)*[1-9]+\.(\s)/, "enumerate"], [/^(\s)*\-(\s)/, "itemize"]];
  let lines = content.split("\n").map(a => a.trimRight().replace(/(\r\n|\n|\r)$/gm, ""));
  lines = lines.map((a, i) => {
    // latex block
    if (a.toLowerCase().startsWith("```latex")) {
      inRawLatexBlock = true;
      return "";
    } else if (inRawLatexBlock && a.startsWith("```")) {
      inRawLatexBlock = false;
      return "";
    } else if (inRawLatexBlock) {
      return a;
    } // code block styles


    if (a.startsWith("```")) {
      inCodeBlock = !inCodeBlock;
    }

    a = mapCodeblocks(a);

    if (inCodeBlock) {
      return a;
    }

    if (a.startsWith("#")) {
      return mapHeadlines(a, i);
    } // text styles


    a = mapInlineTextStyles(a, i);
    a = mapImages(a); // Lists

    const activeEnum = enums.find(([regex]) => {
      return a.match(regex);
    });

    if (activeEnum) {
      const [regex, type] = activeEnum;
      const leadingSpaces = a.search(/\S/);
      a = a.replace(regex, (match, m1, m2) => `${"\t".repeat(leadingSpaces + 1)}\\item${m2}`); // more indentation than before

      if (leadingSpaces + 1 > openEnums.length) {
        a = `${"\t".repeat(leadingSpaces)}\\begin{${type}}\n${a}`;
        openEnums.push(type); // less indentation than before
      } else if (leadingSpaces < openEnums.length) {
        const diff = openEnums.length - leadingSpaces - 1;
        let closingTags = [];

        for (let index = 0; index < diff; index++) {
          const endtype = openEnums.pop();
          closingTags.push(`${"\t".repeat(diff - index)}\\end{${endtype}}`);
        }

        a = `${closingTags.join("\n")}\n${a}`;
      }
    } else if (openEnums.length) {
      a = `${openEnums.map((type, index) => `${"\t".repeat(openEnums.length - index - 1)}\\end{${type}}`).join("\n")}\n${a} ${"\\\\"}`;
      openEnums = [];
    } else if (lines[Math.min(i + 1, lines.length - 1)].replace(/\s/g, "").length && a.replace(/\s/g, "").length) {
      a = `${a} ${"\\\\"}`;
    } // Return Result


    return a;
  });
  const output = lines.slice(0, -1).join("\n");
  logger.log("---\n" + output + "\n---");
  return output;
};

exports.convert = convert;
var _default = convert;
exports.default = _default;
