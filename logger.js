const logger = (level) => {
	const std = {
		log: () => {},
		warn: () => {},
		error: () => {}
	};
	if(level === "log"){
		std.log = console.log;
	}
	if(level === "log" || level === "warn"){
		std.warn = console.warn;
	}
	std.error = console.error;
	return std;
}

export default logger;
