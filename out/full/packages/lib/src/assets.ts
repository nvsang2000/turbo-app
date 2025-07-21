import { parse } from 'path';
import etag from 'etag';

// Cache lưu trữ ETag cho các file tĩnh
const CACHE = new Map<string, string>();

// Danh sách các types có thể nén được
const COMPRESSIBLE_TYPES = new Set([
	'.js',
	'.json',
	'.css',
	'.txt',
	'.html',
	'.xml',
	'.md',
	'.svg',
]);

// Danh sách các hình ảnh có thể chuyển đổi sang WebP
const CONVERTIBLE_TO_WEBP = new Set(['.jpg', '.jpeg', '.png']);

// Headers bảo mật cơ bản
const SECURITY_HEADERS = {
	'X-Content-Type-Options': 'nosniff', // Ngăn chặn MIME type sniffing
	'X-Frame-Options': 'DENY', // Ngăn chặn clickjacking
};

// Các kiểu nén và phần mở rộng tương ứng
const ENCODINGS = {
	br: '.br', // Brotli compression
	gzip: '.gz', // Gzip compression
	deflate: '.deflate', // Deflate compression
};

/**
 * Lấy kiểu nén phù hợp dựa trên Accept-Encoding header
 * @param acceptEncoding - Giá trị của Accept-Encoding header
 * @returns [key, value] - Mảng chứa kiểu nén và phần mở rộng tương ứng
 */
function getEncoding(acceptEncoding: string) {
	for (const key in ENCODINGS) {
		if (acceptEncoding.includes(key))
			return [key, ENCODINGS[key as keyof typeof ENCODINGS]];
	}
	return null;
}

/**
 * Tạo Response với headers chuẩn hóa
 * @param file - File cần trả về
 * @param headers - Headers tùy chỉnh
 * @returns Response object
 */
function createResponse(file: Bun.BunFile, headers: Record<string, string>) {
	return new Response(file, {
		headers: {
			...SECURITY_HEADERS,
			...headers,
		},
	});
}

/**
 * Xử lý và phục vụ file tĩnh
 * @param req - Request object từ client
 * @param path - Đường dẫn tới file
 * @returns Promise<Response> - Response chứa file hoặc thông báo lỗi
 */
export default async function assets(
	req: Bun.BunRequest,
	path: string,
): Promise<Response> {
	try {
		// Kiểm tra file có tồn tại
		const fFile = Bun.file(path);

		if (!(await fFile.exists())) {
			return new Response('Not Found', { status: 404 });
		}

		// Trong môi trường development, không cache và nén
		if (process.env.NODE_ENV !== 'production') {
			return createResponse(fFile, {
				'Content-Type': fFile.type,
				'Cache-Control': 'no-cache',
			});
		}

		// Xử lý ETag để cache trên client
		const curEtag = req.headers.get('if-none-match');
		let fEtag = CACHE.get(path);
		if (!fEtag) {
			fEtag = etag(await fFile.stat());
			CACHE.set(path, fEtag);
		}

		// Trả về 304 Not Modified nếu file không thay đổi
		if (fEtag === curEtag) {
			return new Response('', { status: 304 });
		}

		// Headers cơ bản cho response
		const baseHeaders = {
			'Content-Type': fFile.type,
			ETag: fEtag,
			'Cache-Control': 'public, max-age=31536000', // Cache 1 năm
		};

		// Kiểm tra nếu file là .jpg, .jpeg, hoặc .png và có phiên bản .webp
		const ext = parse(path).ext.toLowerCase();
		if (
			CONVERTIBLE_TO_WEBP.has(ext) &&
			req.headers.get('accept')?.includes('image/webp')
		) {
			const webpFile = Bun.file(path + '.webp');
			if (await webpFile.exists()) {
				return createResponse(webpFile, {
					...baseHeaders,
					'Content-Type': webpFile.type,
				});
			}
		}

		// Bỏ qua nén nếu file type không nằm trong danh sách có thể nén
		if (!COMPRESSIBLE_TYPES.has(ext)) return createResponse(fFile, baseHeaders);

		// Xử lý nén file nếu client hỗ trợ
		const acceptEncoding = req.headers.get('accept-encoding') ?? '';
		const extInfo = getEncoding(acceptEncoding);

		if (extInfo) {
			const compressedFile = Bun.file(path + extInfo[1]);
			if (await compressedFile.exists()) {
				return createResponse(compressedFile, {
					...baseHeaders,
					'Content-Encoding': extInfo[0]!,
				});
			}
		}

		// Trả về file gốc nếu không có phiên bản nén
		return createResponse(fFile, baseHeaders);
	} catch (error) {
		console.error('Asset loading error:', error);
		return new Response('Internal Server Error', { status: 500 });
	}
}
