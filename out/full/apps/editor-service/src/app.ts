import { Elysia } from 'elysia';
import { editorRouter } from '@/routes/editorRoute';
import { swagger } from '@elysiajs/swagger';
import { cors } from '@elysiajs/cors';

const app = new Elysia().use(
	cors({
		origin: true,
		methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
		allowedHeaders: ['Content-Type', 'Authorization'],
		credentials: true,
	}),
);

// Swagger API
if (process.env.NODE_ENV !== 'production') {
	app.use(swagger());
}

// Check error
app.onError(({ error, code, set }) => {
	switch (code) {
		case 'VALIDATION':
			set.status = 400;
			return {
				success: false,
				message: 'Validation failed',
				error: error.message,
			};

		case 'NOT_FOUND':
			set.status = 404;
			return {
				success: false,
				message: 'Not Found',
			};

		default:
			set.status = (error as any)?.status ?? 500;
			return {
				success: false,
				message: (error as any)?.message ?? 'Internal Server Error',
			};
	}
});

// Router editor
app.group('/editor', (group) => group.use(editorRouter));

export default app;
