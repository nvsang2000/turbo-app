import { join } from 'path';
import { serve } from 'bun';
import assets from '@repo/lib/assets';

const ROOT = process.cwd();
const PUBLIC_ROOT = join(ROOT, 'public');
const FILE_INDEX = join(PUBLIC_ROOT, 'index.html');

const server = serve({
	routes: {
		'/*': {
			async GET(req) {
				const p = join(PUBLIC_ROOT, new URL(req.url).pathname);
				const f = Bun.file(p);
				if (await f.exists()) {
					return await assets(req, p);
				}
				return await assets(req, FILE_INDEX);
			},
		},
	},
	development: process.env.NODE_ENV !== 'production',
	port: process.env.PORT ?? 3000,
});

// Thành công
console.log(`Server is running at ${server.hostname}:${server.port}`);
