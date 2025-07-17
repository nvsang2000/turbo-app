import { mock } from 'bun:test';

const oldEtag = (await import('etag')).default;

mock.module('etag', () => {
	return {
		default: function (content: any) {
			return oldEtag(
				typeof content === 'string' ? content : JSON.stringify(content),
			);
		},
	};
});
