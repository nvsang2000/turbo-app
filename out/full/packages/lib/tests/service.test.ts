import { describe, expect, test, beforeAll, afterEach } from 'bun:test';
import { mock } from 'bun:test';
import Service from '../src/service';

/**
 * Test suite: Service Module
 * Kiểm tra:
 * - Tạo URL trong các môi trường khác nhau
 * - Gửi và nhận HTTP requests
 * - Xử lý các loại lỗi
 * - Parse các loại response khác nhau
 */
describe('Service Module', () => {
	// Tạo mock server và lưu fetch API gốc
	const mockServer = mock(() => Promise.resolve(new Response()));
	const originalFetch = global.fetch;

	// Thiết lập môi trường test
	beforeAll(() => {
		// Đặt môi trường development và endpoint test
		process.env.NODE_ENV = 'development';
		process.env.SERVICE_GATEWAY = 'http://localhost:3000';
	});

	// Reset mock sau mỗi test case
	afterEach(() => {
		mockServer.mockClear();
		global.fetch = originalFetch;
	});

	/**
	 * Test case: Tạo URL cho môi trường development
	 * Điều kiện:
	 * - Đang ở môi trường development
	 * - Có SERVICE_GATEWAY được cấu hình
	 * - Request không có params
	 * Kỳ vọng:
	 * - URL được tạo với domain và port chính xác
	 * - Path được giữ nguyên
	 */
	describe('URL Generation', () => {
		test('nên tạo URL đúng cho môi trường development', async () => {
			const response = { data: 'test' };
			// Mock fetch API để trả về response giả
			global.fetch = mock(() =>
				Promise.resolve(
					new Response(JSON.stringify(response), {
						headers: { 'Content-Type': 'application/json' },
					}),
				),
			) as any;

			// Gọi API và kiểm tra URL được tạo
			await Service.get('system/auth/login');
			expect(global.fetch).toHaveBeenCalledWith(
				'http://localhost:3000/system/auth/login',
				expect.any(Object),
			);
		});
	});

	/**
	 * Test case: Gửi GET request với params
	 * Điều kiện:
	 * - Có query params
	 * - Response trả về JSON
	 * Kỳ vọng:
	 * - Request được gửi với method GET
	 * - Query params được encode đúng
	 */
	describe('HTTP Methods', () => {
		test('nên gửi GET request với params', async () => {
			const params = { id: '123' };
			global.fetch = mock(() =>
				Promise.resolve({
					ok: true,
					json: () => Promise.resolve({}),
					headers: new Headers({ 'Content-Type': 'application/json' }),
				}),
			) as any;

			await Service.get('test', params);

			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining('id=123'),
				expect.objectContaining({ method: 'GET' }),
			);
		});

		test('nên gửi POST request với body', async () => {
			const data = { name: 'test' };
			global.fetch = mock(() =>
				Promise.resolve({
					ok: true,
					json: () => Promise.resolve({}),
					headers: new Headers({ 'Content-Type': 'application/json' }),
				}),
			) as any;

			await Service.post('test', data);

			expect(global.fetch).toHaveBeenCalledWith(
				expect.any(String),
				expect.objectContaining({
					method: 'POST',
					body: JSON.stringify(data),
				}),
			);
		});
	});

	/**
	 * Test case: Xử lý HTTP errors
	 * Điều kiện:
	 * - Server trả về status code lỗi
	 * - Response không ok
	 * Kỳ vọng:
	 * - Throw error với message chứa status code
	 */
	describe('Error Handling', () => {
		test('nên xử lý HTTP errors', async () => {
			global.fetch = mock(() =>
				Promise.resolve({
					ok: false,
					status: 404,
				}),
			) as any;

			await expect(Service.get('test')).rejects.toThrow('HTTP Error: 404');
		});
	});

	/**
	 * Test case: Xử lý lỗi an toàn
	 * Điều kiện:
	 * - Có lỗi xảy ra trong quá trình request
	 * - Sử dụng các phương thức safe_*
	 * Kỳ vọng:
	 * - Không throw error
	 * - Trả về undefined khi có lỗi
	 */
	describe('Safe Methods', () => {
		test('nên trả về undefined khi có lỗi trong safe_get', async () => {
			global.fetch = mock(() => Promise.reject(new Error('Network error'))) as any;

			const result = await Service.safe_get('test');
			expect(result).toBeUndefined();
		});

		test('nên trả về dữ liệu khi safe_post thành công', async () => {
			const response = { success: true };
			global.fetch = mock(() =>
				Promise.resolve({
					ok: true,
					json: () => Promise.resolve(response),
					headers: new Headers({ 'Content-Type': 'application/json' }),
				}),
			) as any;

			const result = await Service.safe_post('test', { data: 'test' });
			expect(result).toEqual(response);
		});
	});

	/**
	 * Test case: Parse các loại response
	 * Điều kiện:
	 * - Response có Content-Type khác nhau
	 * - Response body có format khác nhau
	 * Kỳ vọng:
	 * - Parse JSON thành object
	 * - Giữ nguyên response text
	 */
	describe('Content Type Handling', () => {
		test('nên xử lý response JSON', async () => {
			const response = { data: 'test' };
			global.fetch = mock(() =>
				Promise.resolve({
					ok: true,
					json: () => Promise.resolve(response),
					headers: new Headers({ 'Content-Type': 'application/json' }),
				}),
			) as any;

			const result = await Service.get('test');
			expect(result).toEqual(response);
		});

		test('nên xử lý response text', async () => {
			const response = 'Hello World';
			global.fetch = mock(() =>
				Promise.resolve({
					ok: true,
					text: () => Promise.resolve(response),
					headers: new Headers({ 'Content-Type': 'text/plain' }),
				}),
			) as any;

			const result = await Service.get('test');
			expect(result).toBe(response);
		});
	});
});
