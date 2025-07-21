import { describe, expect, test, mock, beforeEach, afterEach } from 'bun:test';
import { file } from 'bun';
import assets from '../src/assets';
import etag from 'etag';

/**
 * Test suite cho module xử lý assets
 * Kiểm tra các chức năng:
 * - Xử lý file không tồn tại
 * - Phục vụ file trong môi trường development
 * - Xử lý cache với ETag
 * - Nén file và content negotiation
 * - Chuyển đổi ảnh sang WebP
 */
describe('Assets handler', () => {
	beforeEach(() => {
		process.env.NODE_ENV = 'development';
	});

	afterEach(() => {
		process.env.NODE_ENV = undefined;
	});

	/**
	 * Test case: Xử lý file không tồn tại
	 * Điều kiện:
	 * - File không tồn tại
	 * Kỳ vọng: Trả về status code 404
	 */
	test('nên trả về 404 khi file không tồn tại', async () => {
		// Tạo request giả lập đến file không tồn tại
		const req = new Request('http://localhost/not-found.txt');
		const response = await assets(req as any, '/not-found.txt');

		// Kiểm tra status code
		expect(response.status).toBe(404);
	});

	/**
	 * Test case: Phục vụ file trong môi trường development
	 * Điều kiện:
	 * - File tồn tại
	 * - Môi trường là development
	 * Kỳ vọng:
	 * - Status 200
	 * - Không cache
	 * - Nội dung file chính xác
	 */
	test('nên trả về file không nén trong môi trường development', async () => {
		// Khởi tạo file test với nội dung
		const testContent = 'test content';
		await Bun.write('test.txt', testContent);

		// Tạo request giả lập
		const req = new Request('http://localhost/test.txt');
		const response = await assets(req as any, 'test.txt');

		// Kiểm tra các điều kiện
		expect(response.status).toBe(200);
		expect(response.headers.get('Cache-Control')).toBe('no-cache');
		expect(await response.text()).toBe(testContent);

		// Xóa file test sau khi hoàn thành
		await Bun.file('test.txt').delete();
	});

	/**
	 * Test case: Xử lý ETag cache
	 * Điều kiện:
	 * - File tồn tại
	 * - Môi trường là production
	 * - Client gửi header If-None-Match với ETag
	 * - ETag khớp với file
	 * Kỳ vọng: Trả về 304 Not Modified khi ETag khớp
	 */
	test('nên trả về 304 Not Modified khi ETag khớp', async () => {
		// Tạo file test và ETag giả
		await Bun.write('test.txt', 'test content');
		const testFile = file('test.txt');
		const testEtag = etag(await testFile.stat());

		// Tạo request với header If-None-Match
		const req = new Request('http://localhost/test.txt', {
			headers: {
				'if-none-match': testEtag,
			},
		});

		// Chuyển sang môi trường production để test cache
		process.env.NODE_ENV = 'production';
		const response = await assets(req as any, 'test.txt');

		// Kiểm tra status code
		expect(response.status).toBe(304);

		// Dọn dẹp
		await testFile.delete();
	});

	/**
	 * Test case: Nén file khi client hỗ trợ
	 * Điều kiện:
	 * - File tồn tại
	 * - Môi trường là production
	 * - Client gửi header Accept-Encoding với gzip
	 * - File nén tồn tại
	 * - File gốc tồn tại
	 * Kỳ vọng: Trả về phiên bản nén của file với header phù hợp
	 */
	test('nên trả về file nén khi client hỗ trợ và file nén tồn tại', async () => {
		// Tạo cả file gốc và file nén
		const content = 'test content';
		await Bun.write('test.txt', content);
		await Bun.write('test.txt.gz', content);

		// Tạo request với Accept-Encoding: gzip
		const req = new Request('http://localhost/test.txt', {
			headers: {
				'Accept-Encoding': 'gzip,deflate',
			},
		});

		// Test trong môi trường production
		process.env.NODE_ENV = 'production';
		const response = await assets(req as any, 'test.txt');

		// Kiểm tra header nén
		expect(response.headers.get('Content-Encoding')).toBe('gzip');

		// Dọn dẹp
		await Bun.file('test.txt').delete();
		await Bun.file('test.txt.gz').delete();
	});

	/**
	 * Test case: Xử lý khi client không hỗ trợ nén
	 * Điều kiện:
	 * - Không có Accept-Encoding trong request
	 * - File gốc tồn tại
	 * - Môi trường production
	 * Kỳ vọng: Trả về file gốc không nén
	 */
	test('nên trả về file gốc khi không hỗ trợ nén', async () => {
		// Tạo file test
		const content = 'test content';
		await Bun.write('test.txt', content);

		// Tạo request không có Accept-Encoding
		const req = new Request('http://localhost/test.txt');

		// Test trong môi trường production
		process.env.NODE_ENV = 'production';
		const response = await assets(req as any, 'test.txt');

		// Kiểm tra không có nén và nội dung chính xác
		expect(response.headers.get('Content-Encoding')).toBeNull();
		expect(await response.text()).toBe(content);

		// Dọn dẹp
		await Bun.file('test.txt').delete();
	});
});

/**
 * Test suite cho chức năng chuyển đổi WebP
 * Kiểm tra:
 * - Trả về WebP khi client hỗ trợ và file tồn tại
 * - Trả về file gốc khi không có WebP
 * - Trả về file gốc khi client không hỗ trợ WebP
 */
describe('WebP Conversion', () => {
	// Lưu trữ instance gốc của file API để khôi phục sau test
	const originalFile = file;

	// Tạo mock cho file API với các phương thức cơ bản
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const mockFile = mock((path: string) => ({
		exists: mock(() => Promise.resolve(false)),
		type: 'text/plain',
		stat: mock(() => Promise.resolve({})),
	}));

	afterEach(() => {
		process.env.NODE_ENV = undefined;
		mockFile.mockClear();
		(global as any).file = (Bun as any).file = originalFile as any;
	});

	beforeEach(() => {
		// Thiết lập môi trường production cho test WebP
		process.env.NODE_ENV = 'production';
		(global as any).file = (Bun as any).file = mockFile as any;
	});

	/**
	 * Test case: Trả về WebP khi điều kiện phù hợp
	 * Điều kiện:
	 * - Client hỗ trợ WebP (Accept header)
	 * - File WebP tồn tại
	 * - Đang ở môi trường production
	 * Kỳ vọng:
	 * - Trả về file WebP với Content-Type là image/webp
	 * - Trả về file gốc nếu không có WebP
	 * - Trả về file gốc nếu client không hỗ trợ WebP
	 */
	test('nên trả về tệp .webp nếu tồn tại và client hỗ trợ', async () => {
		// Mock file jpg và webp
		const jpgFile = {
			exists: mock(() => Promise.resolve(true)),
			type: 'image/jpeg',
			stat: mock(() => Promise.resolve({ size: 1000, mtime: new Date() })),
		};

		const webpFile = {
			exists: mock(() => Promise.resolve(true)),
			type: 'image/webp',
			stat: mock(() => Promise.resolve({ size: 800, mtime: new Date() })),
		};

		// Cấu hình mock để trả về file phù hợp
		mockFile.mockImplementation((path: string) => {
			if (path.endsWith('.webp')) return webpFile;
			return jpgFile;
		});

		// Tạo request với Accept: image/webp
		const req = new Request('http://localhost/test.jpg', {
			headers: { Accept: 'image/webp,image/jpeg' },
		});

		const response = await assets(req as any, '/test.jpg');

		// Verify response
		expect(response.status).toBe(200);
		expect(response.headers.get('Content-Type')).toBe('image/webp');
	});

	/**
	 * Test case: Trả về file gốc nếu không có WebP
	 * Điều kiện:
	 * - Client hỗ trợ WebP (Accept header)
	 * - File WebP không tồn tại
	 * - Đang ở môi trường production
	 * Kỳ vọng:
	 * - Trả về file gốc với Content-Type là image/jpeg
	 */
	test('nên trả về tệp gốc nếu không có tệp .webp', async () => {
		(global as any).file = (Bun as any).file = mockFile as any;

		// Mock chỉ có file jpg
		const jpgFile = {
			exists: mock(() => Promise.resolve(true)),
			type: 'image/jpeg',
			stat: mock(() => Promise.resolve({ size: 1000, mtime: new Date() })),
		};

		// Mock file webp không tồn tại
		const webpFile = {
			exists: mock(() => Promise.resolve(false)),
		};

		// Thiết lập mock
		mockFile.mockImplementation((path: string) => {
			if (path.endsWith('.webp')) {
				return webpFile as any;
			}
			return jpgFile;
		});

		// Tạo request
		const req = new Request('http://localhost/test.jpg', {
			headers: {
				Accept: 'image/webp,image/jpeg',
			},
		});

		const response = await assets(req as any, '/test.jpg');

		// Kiểm tra response
		expect(response.status).toBe(200);
		expect(response.headers.get('Content-Type')).toBe('image/jpeg');
	});

	/**
	 * Test case: Trả về file gốc nếu client không hỗ trợ WebP
	 * Điều kiện:
	 * - Client không hỗ trợ WebP (Accept header)
	 * - File WebP tồn tại
	 * - Đang ở môi trường production
	 * Kỳ vọng:
	 * - Trả về file gốc với Content-Type là image/jpeg
	 */
	test('nên trả về tệp gốc nếu client không hỗ trợ webp', async () => {
		(global as any).file = (Bun as any).file = mockFile as any;

		// Mock cả file jpg và webp tồn tại
		const jpgFile = {
			exists: mock(() => Promise.resolve(true)),
			type: 'image/jpeg',
			stat: mock(() => Promise.resolve({ size: 1000, mtime: new Date() })),
		};

		const webpFile = {
			exists: mock(() => Promise.resolve(true)),
			type: 'image/webp',
			stat: mock(() => Promise.resolve({ size: 800, mtime: new Date() })),
		};

		mockFile.mockImplementation((path: string) => {
			if (path.endsWith('.webp')) {
				return webpFile;
			}
			return jpgFile;
		});

		// Tạo request không có Accept: image/webp
		const req = new Request('http://localhost/test.jpg', {
			headers: {
				Accept: 'image/jpeg',
			},
		});

		const response = await assets(req as any, '/test.jpg');

		// Kiểm tra response
		expect(response.status).toBe(200);
		expect(response.headers.get('Content-Type')).toBe('image/jpeg');
	});
});
