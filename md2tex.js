// Copyright (C) 2019 Adrian Jost
// This code is licensed under MIT license (see https://tldrlegal.com/license/mit-license for details)

import logLib from "./logger";

let logger = logLib();

const escapeSpecialChars = text => {
	const replaceOnce = target => (match, p1, offset, src) => {
		return src.indexOf(target, offset) === 0 ? match : target;
	};
	text = text.replace(/([\\])/g, replaceOnce("\\textbackslash "));
	text = text.replace(/([\~])/g, replaceOnce("\\textasciitilde "));
	text = text.replace(/([\^])/g, replaceOnce("\\textasciicircum "));
	const prefix = char => `\\${char}`;
	text = text.replace(/([\&\%\$\#\_\{\}])/g, prefix);
	return text;
};
const removeSpecialChars = text =>
	text.replace(/([\&\%\$\#\_\{\}\~\^\\])/g, "");

const mapHeadlines = (line, index) => {
	let content = line.replace(/^[#]+\W/, "");
	const text = mapInlineTextStyles(content);
	const identifier =
		`${index}-` + removeSpecialChars(content.toLowerCase()).replace(/\W/g, "-");
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
\\end{listing}`;
	}
	const meta = line.slice(3).trim();

	const languageRegex = /^([^\[]*)(?!\[)/;
	const captionRegex = /\[(.*)\]/;
	const language = (languageRegex.exec(meta) || [])[1];
	const caption = (captionRegex.exec(line) || [])[1];

	return `\\begin{listing}[H]
	\\caption{${caption ? escapeSpecialChars(caption) : " "}}
	\\label{lst:${
		caption
			? removeSpecialChars(caption).replace(/\s/g, "-")
			: `code-snipped-${index}`
	}}
	\\begin{minted}{${language}}`;
};

const mapImages = line => {
	const replaceImage = function(match) {
		const args = Array.from(arguments);
		const filename = args[2].split('/')[-1]
		return `
		\\immediate\\write18{wget ${args[2]}}
		\\IfFileExists{${`${filename}`.replaceAll('_','\\_')}}
		{
			\\begin{figure}[H]
			\\centering
			\\includegraphics[width=\\textwidth]{${filename}}
			\\caption[${removeSpecialChars(args[1])}]{${removeSpecialChars(args[1])}}
			\\label{fig:${removeSpecialChars(args[1])}}
			\\end{figure}
		}{}
		`;
	};
	return line.replace(/\!\[([^\]]*)\]\(([^\)]+)\)/g, replaceImage);
};

const mapTextStyle = line => {
	const replaceWithUnescapedMatch = newString =>
		function(match) {
			let out = newString;
			Array.from(arguments).forEach((a, i) => {
				// mimic .replace api
				if (typeof a !== "string") {
					return;
				}
				// unescape
				const unescaped = escapeSpecialChars(a.replace(/\\([\*\_\\])/g, "$1"));
				out = out.replace(`$${i}`, unescaped);
			});
			return out;
		};

	// 1. escape all _ and * inside urls
	// https://regex101.com/r/TJ2xDV/3
	line = line.replace(/(?<=[^\!]\[.*\]\(.*)([\\\_\*])(?=.*\))/g, "\\$1");

	// 2. apply bold when not escaped. then unescape the text
	line = line
		// check regex for single character below for details
		.replace(
			/(?<=(?:^|[^\\])(?:\\\\)*)(?<!\!\[.*\].*)(\*\*|\_\_)((?:[^\\]|\\[^\\]|\\\\)*?)\1/g,
			replaceWithUnescapedMatch("\\textbf{$2}")
		);
	// 3. apply italic when not escaped. then unescape the text
	line = line
		// https://regex101.com/r/jocMku/2
		.replace(
			/(?<=(?:^|[^\\])(?:\\\\)*)(?<!\!\[.*\].*)(\*|\_)((?:[^\\]|\\[^\\]|\\\\)*?)\1/g,
			replaceWithUnescapedMatch("\\textit{$2}")
		);
	// 4. unescape all text inside links
	line = line.replace(/(?<=[^\!]\[.*\]\(.*)\\([\_\*])(?=.*\))/g, "$1");

	return line;
};

const mapInlineCodeblocks = line => {
	const inlineCode = function() {
		const args = Array.from(arguments);
		return `\\colorbox{gray-light!}{\\texttt{${escapeSpecialChars(args[1])}}}`;
	};
	return line.replace(/\`([^\`]*?)\`/g, inlineCode);
};

const mapFootnotes = line => {
	const footnote = function() {
		const args = Array.from(arguments);
		return (args[2].match(/^\`.*\`$/))
			// Source
			? `${escapeSpecialChars(args[1])}\\cite{${
					args[2].match(/^\`(.*)\`$/)[1]
				}}`
			// Footnote
			: `${escapeSpecialChars(args[1])}\\footnote{${escapeSpecialChars(
					args[2]
				)}}`;
	};
	return line.replace(/(?<!\!)\[([^\]]*)\]\(([^\)]+)\)/g, footnote);
};

const mapInlineTextStyles = (line, index) => {
	line = mapTextStyle(line);
	line = mapFootnotes(line);
	line = mapInlineCodeblocks(line, index);
	return line;
};

export const convert = (content, { loglevel = "warn" } = {}) => {
	logger = logLib(loglevel);
	content = content + "\n".repeat(2);
	let inRawLatexBlock = false;
	let inCodeBlock = false;
	let openEnums = [];
	const enums = [
		[/^(\s)*[1-9]+\.(\s)/, "enumerate"],
		[/^(\s)*\-(\s)/, "itemize"]
	];
	let lines = content
		.split("\n")
		.map(a => a.trimRight().replace(/(\r\n|\n|\r)$/gm, ""));
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
		}

		// code block styles
		if (a.startsWith("```")) {
			inCodeBlock = !inCodeBlock;
		}
		a = mapCodeblocks(a, i);
		if (inCodeBlock) {
			return a;
		}

		if (a.startsWith("#")) {
			return mapHeadlines(a, i);
		}
		// text styles
		a = mapInlineTextStyles(a, i);
		a = mapImages(a);

		// Lists
		const activeEnum = enums.find(([regex]) => {
			return a.match(regex);
		});

		if (activeEnum) {
			const [regex, type] = activeEnum;

			const leadingSpaces = a.search(/\S/);
			a = escapeSpecialChars(a).replace(
				regex,
				(match, m1, m2) => `${"\t".repeat(leadingSpaces + 1)}\\item${m2}`
			);

			// more indentation than before
			if (leadingSpaces + 1 > openEnums.length) {
				a = `${"\t".repeat(leadingSpaces)}\\begin{${type}}\n${a}`;
				openEnums.push(type);
				// less indentation than before
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
			a = `${openEnums
				.map(
					(type, index) =>
						`${"\t".repeat(openEnums.length - index - 1)}\\end{${type}}`
				)
				.join("\n")}\n${a} ${
				lines[Math.min(i + 1, lines.length - 1)].replace(/\s/g, "").length &&
				a.replace(/\s/g, "").length
					? "\\\\"
					: ""
			}`;
			openEnums = [];
		} else if (
			lines[Math.min(i + 1, lines.length - 1)].replace(/\s/g, "").length &&
			a.replace(/\s/g, "").length
		) {
			a = `${a} ${"\\\\"}`;
		}

		// Return Result
		return a;
	});
	const output = lines.slice(0, -1).join("\n");
	logger.log("---\n" + output + "\n---");
	return output;
};

export default convert;
