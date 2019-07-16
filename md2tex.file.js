// Copyright (C) 2019 Adrian Jost
// This code is licensed under MIT license (see https://tldrlegal.com/license/mit-license for details)

import fs from "fs";
import path from "path";
import logLib from "./logger";
import convert from "./md2tex";

const logger = logLib("log");

const readFile = filename => {
	return new Promise((resolve, reject) => {
		fs.readFile(filename, "utf8", function(err, data) {
			if(err){
				logger.error(err)
			}
			return err ? reject(err) : resolve(data);
		});
	});
};

const writeFile = (filepath, content) => {
	return new Promise((resolve, reject) => {
		if(!fs.existsSync(path.dirname(filepath))){
			fs.mkdirSync(path.dirname(filepath), { recursive: true })
		}
		fs.writeFile(filepath, content, function(err) {
			if(err){
				logger.error(err)
			}
			return err ? reject(err) : resolve();
		});
	});
};

const readFilelist = (dir, filelist = [], baseDir) => {
	if(!baseDir){
		baseDir = dir;
	}
  fs.readdirSync(dir).forEach(file => {

    filelist = fs.statSync(path.join(dir, file)).isDirectory()
      ? readFilelist(path.join(dir, file), filelist, baseDir)
      : filelist.concat(path.relative(baseDir, path.join(dir, file)));

  });
return filelist;
}

export const convertFile = async (filenameIn, filenameOut) => {
	try{
		const content = await readFile(filenameIn || "./in.md");
		const output = convert(content);
		writeFile(filenameOut || "./out.tex", output);
	}catch(error){
		logger.error(error);
	}
};

const inPath = process.argv[2] || "./in.md"
const outPath = process.argv[3] || "./out.md"

logger.log(`Convert File(s) from "${inPath}" to "${outPath}"\n...`);
if(fs.statSync(inPath).isDirectory()){
	if(fs.existsSync(outPath) && !fs.statSync(outPath).isDirectory()){
		logger.error("!!! Output Path is not a directory")
	}
	const fileList = readFilelist(inPath).filter(relPath => /\.md$/i.test(relPath));
	fileList.forEach((relPath, index) => {
		logger.log(`${index}/${fileList.length} - ${relPath}`)
		convertFile(path.join(inPath, relPath), path.join(outPath, relPath).replace(".md", ".tex"));
	})
}else{
	if(fs.existsSync(outPath) && fs.statSync(outPath).isDirectory()){
		logger.error("!!! Output Path is not a file")
	}
	convertFile(inPath, outPath);
}
logger.log('DONE - All files converted');
