# An opinionated Markdown to Latex Converter

[![Build Status](https://travis-ci.com/adrianjost/md2tex.svg?branch=master)](https://travis-ci.com/adrianjost/md2tex)
[![codecov](https://codecov.io/gh/adrianjost/md2tex/branch/master/graph/badge.svg)](https://codecov.io/gh/adrianjost/md2tex)
[![Greenkeeper badge](https://badges.greenkeeper.io/adrianjost/md2tex.svg)](https://greenkeeper.io/)

[![npm (scoped)](https://img.shields.io/npm/v/@adrianjost/md2tex.svg) ![npm](https://img.shields.io/npm/dy/@adrianjost/md2tex.svg)](https://www.npmjs.com/package/@adrianjost/md2tex)
[![npm bundle size (scoped)](https://img.shields.io/bundlephobia/min/@adrianjost/md2tex.svg)](https://bundlephobia.com/result?p=@adrianjost/md2tex)

**Warning:** This Code is a total mess! I am sorry for that. But it has 100% test coverage so whenever someone introduces a new hack to get it working, we can be confident that nothing unexpectedly breaks.

All features were developed for compatibility with [the modernthesis template](https://github.com/openHPI/modernthesis).

## How to use it

### As a standalone converter

#### Install

```bash
# yarn
yarn global add @adrianjost/md2tex

# or npm
npm i -g @adrianjost/md2tex
```

#### Usage

```bash
md2tex "pathToSrcMdFile" "pathToTargetTexFile"
```

- The `pathToSrcMdFile` default to `./in.md`.
- The `pathToTargetTexFile` default to `./out.tex`.

If you provide a directory path instead of a file for both paths, all `.md` files will get converted to the output directory. The Filestructure will remain the same.

### As a regular dependency

#### Install

```bash
# yarn
yarn add -D @adrianjost/md2tex

# or npm
npm i -D @adrianjost/md2tex
```

#### Usage

```js
import md2tex from "@adrianjost/md2tex";
// or
// const { convert: md2tex } = require("@adrianjost/md2tex")

const md = `# Hello World`;
const tex = md2tex(md);
console.log(tex);
```

## Features

You can use a codeblock with the language `latex` to write latex code directly in your markdown files. This Code is getting directly copied into the output without any further conversion.

### Headlines

**Input:**

```md
# H1
## H2
### H3
#### H4
##### H5
###### H6
```

**Output:**

```tex
%************************************************
\chapter{H1}
\label{ch:0-h1}
%************************************************
\hypertarget{1-h2}{
\section{H2}\label{1-h2}}
\hypertarget{2-h3}{
\subsection{H3}\label{2-h3}}
\hypertarget{3-h4}{
\subsubsection{H4}\label{3-h4}}
\hypertarget{4-h5}{
\paragraph{H5}\label{4-h5}}
\hypertarget{5-h6}{
\subparagraph{H6}\label{5-h6}}
```

### Text Styles

**Input:**

```md
**bold** or **bold**
_italic_ or _italic_
`inline code`
```

**Output:**

```tex
\textbf{bold} or \textbf{bold} \\
\textit{italic} or \textit{italic} \\
\colorbox{gray-light!}{\texttt{inline code}}
```

### Links

Links get converted to footnotes or BibLatex Source References

**Input:**

```md
[descrition](footnote)

[source](`reference`)
```

**Output:**

```tex
description\\footnote{footnote}

source\\cite{reference}
```

### Images

**Input:**

```md
![description](path)
```

**Output:**

```tex
\begin{figure}[H]
	\centering
	\includegraphics[width=\textwidth]{path}
	\caption[description]{description}
	\label{fig:description}
\end{figure}
```

### Codeblocks

🌟 Please note the special syntax for captions.

**Input:**

````md
```js [some caption]
console.log("Hi");
```
````

**Output:**

```tex
\begin{listing}[H]
	\caption{some caption}
	\label{lst:some caption}
	\begin{minted}{js}
console.log("Hi");
	\end{minted}
\end{listing}
```

### Lists

**Input:**

```md
- list item 1
	- indentation 1
- list item 2

1. first
2. second
```

**Output:**

```tex
\begin{itemize}
	\item list item 1
	\begin{itemize}
		\item indentation 1
	\end{itemize}
	\item list item 2
\end{itemize}

\begin{enumerate}
	\item first

	\item second
\end{enumerate}
```

## Known Limitations

- Currently, this code can't convert tables
- It is also not possible to use inline styles in headlines like `# _italic_ headline`
- Not all characters get escaped correctly. It's not working inside headlines and normal text without any formatting.

## Contribute

You wan't to contribute? Feel free to do so!

If you have found a bug, just add a snapshot test to the tests located at `__tests__/md2tex.test.js` and open a pull request.
