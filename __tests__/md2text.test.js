import { convert as converter } from "../md2tex";
import dd from "dedent-tabs";

const convert = (content, config = { loglevel: "log"}) => {
	return converter(content, config);
}

describe("md2tex", () => {
	it("headlines", () => {
		expect(
			convert(dd`
				# H1
				## H2
				### H3
				#### H4
				##### H5
				###### H6
			`)
		).toMatchSnapshot();
	});
	/*
	it("headlines with escaped characters", () => {
		expect(
			convert(dd`
				# escapes
				## blocks
				### ~ tilde ~
				### ^I don't know
				### \\ backslash \\
				## & other &
				### % procent %
				### $ money $ dollar
				### # hashtag #
				### _ underscore _
				###### ({brackets})
			`)
		).toMatchSnapshot();
	});
	*/
	it("headlines with styles and code", () => {
		expect(
			convert(dd`
				# *italic* _underscore_
				## \`Code\` headline
			`)
		).toMatchSnapshot();
	});
	it("inline styles", () => {
		expect(
			convert(dd`
				*italic* normal _italic_
				**bold** normal __bold__
			`)
		).toMatchSnapshot();
	});
	it("inline styles with links and images", () => {
		expect(
			convert(dd`
				*italic* [link](without_any_italic_styles) _italic_
				**bold** ![images](shouldn**t**be__bold__eighter).
			`)
		).toMatchSnapshot();
	});
	it("footnotes", () => {
		expect(convert(dd`some [footnote](footnote text)`)).toMatchSnapshot();
	});
	it("images", () => {
		expect(convert(dd`some ![image](url)`)).toMatchSnapshot();
	});
	it("ordered list", () => {
		expect(
			convert(dd`
		1. first entry
			1. first indentation
				1. even more indentation
		2. second entry
			1. indented
				1. and done
		`)
		).toMatchSnapshot();
	});
	it("unordered list", () => {
		expect(
			convert(dd`
		- first entry
			- first indentation
				- even more indentation
		- second entry
			- indented
				- and done
		`)
		).toMatchSnapshot();
	});
	it("mixed list", () => {
		expect(
			convert(dd`
		1. first entry
			- first indentation
				- even more indentation
			- second subentry
		2. second entry
			1. indented
				- unorderd sublist
		`)
		).toMatchSnapshot();
	});
	it("code blocks", () => {
		expect(
			convert(dd`
			some text before
			\`\`\`js
			console.log("Hi");
			\`\`\`
			and some behind
		`)
		).toMatchSnapshot();
	});
	it("raw latex blocks", () => {
		expect(
			convert(dd`
			some text before
			\`\`\`latex
			\\textbackslash backslash
			\`\`\`
			and some behind
		`)
		).toMatchSnapshot();
	});
	it("log error for unsupported heading levels", () => {
		expect(
			convert(dd`
			######## H8 is unsupported, errors are expected
		`)
		).toMatchSnapshot();
	});
});
