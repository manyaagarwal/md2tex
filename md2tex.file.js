import fs from "fs";
import logger from "./logger";
import convert from "./md2tex";

const readFile = filename => {
	return new Promise((resolve, reject) => {
		fs.readFile(filename, "utf8", function(err, data) {
			err ? logger.error(err) : logger.log("The file was read.");
			return err ? reject(err) : resolve(data);
		});
	});
};

const writeFile = (filepath, content) => {
	return new Promise((resolve, reject) => {
		fs.writeFile(filepath, content, function(err) {
			err ? logger.error(err) : logger.log("The file was saved.");
			return err ? reject(err) : resolve();
		});
	});
};

export const convertFile = async (filenameIn, filenameOut) => {
	filenameIn;
	const content = await readFile(filenameIn || "./in.md");
	const output = convert(content);
	writeFile(filenameOut || "./out.tex", output);
};

convertFile()
