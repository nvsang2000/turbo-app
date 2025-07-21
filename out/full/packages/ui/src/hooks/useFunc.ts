import { useMemo } from 'react';

const EMPTY = [];

function fFunc() {
	let raw: any;
	const ff = function (...args: any[]) {
		return raw(...args);
	};
	return (v) => {
		raw = v;
		return ff;
	};
}

/**
 * Tương tự như useCallback của react, tuy nhiên không cần dependencies
 * @param handle
 * @returns
 * @example
 */
export function useFunc<T>(handle: T): T {
	return useMemo(fFunc, EMPTY)(handle) as any;
}
