import fs from "fs";
import path from "path";
import logLib from "./logger";
import convert from "./md2tex";

const logger = logLib();

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
		if(!fs.existsSync(path.dirname(filepath))){
			fs.mkdirSync(path.dirname(filepath), { recursive: true })
		}
		fs.writeFile(filepath, content, function(err) {
			err ? logger.error(err) : logger.log("The file was saved.");
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
	filenameIn;
	const content = await readFile(filenameIn || "./in.md");
	const output = convert(content);
	writeFile(filenameOut || "./out.tex", output);
};

const inPath = process.argv[2] || "./in.md"
const outPath = process.argv[3] || "./out.md"

console.log(`Convert from "${inPath}" to "${outPath}"\n...`);
if(fs.statSync(inPath).isDirectory()){
	if(fs.existsSync(outPath) && !fs.statSync(outPath).isDirectory()){
		logger.error("Output Path is not a directory")
	}
	readFilelist(inPath).forEach((relPath) => {
		if(!/\.md$/i.test(relPath)){
			// skip non md files
			return;
		}
		convertFile(path.join(inPath, relPath), path.join(outPath, relPath).replace(".md", ".tex"));
	})
}else{
	if(fs.existsSync(outPath) && fs.statSync(outPath).isDirectory()){
		logger.error("Output Path is not a file")
	}
	convertFile(inPath, outPath);
}
console.log(`Conversion finished :D`);
