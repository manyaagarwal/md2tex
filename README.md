# An opinionated Markdown to Latex Converter

[![Build Status](https://travis-ci.com/adrianjost/md2tex.svg?branch=master)](https://travis-ci.com/adrianjost/md2tex)
[![codecov](https://codecov.io/gh/adrianjost/md2tex/branch/master/graph/badge.svg)](https://codecov.io/gh/adrianjost/md2tex)

**Warning:** This Code is a total mess! I am sorry for that. But it has 100% test coverage so whenever someone introduces a new hack to get it working, we can be confident that nothing unexpectedly breaks.

All features were developed for compatibility with [the modernthesis template](https://github.com/openHPI/modernthesis).

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

Links get converted to footnotes

**Input:**

```md
[descrition](footnote)
```

**Output:**

```tex
description\\footnote{footnote}
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

**Input:**

````md
```js
console.log("Hi");
```
````

**Output:**

```tex
\begin{listing}[H]
	\begin{minted}{js}
console.log("Hi");
	\end{minted}
	\caption{Code Snipped undefined}
	\label{lst:code-snipped-undefined}
\end{listing}
```

### Lists

**Input:**

```md
- list item 1 - indentation 1
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

## Missing Features

- Currently, this code can't convert tables
