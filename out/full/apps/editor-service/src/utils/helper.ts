export const parseSafe = (str: any) => {
	try {
		const result = JSON.parse(str);

		return result;
	} catch (e) {
		console.error(e);
		return undefined;
	}
};
