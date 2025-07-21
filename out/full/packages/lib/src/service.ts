import fs from 'fs';
import path from 'path';
import safe from './safe';
import { parse } from 'dotenv';

/**
 * Định nghĩa các tùy chọn khi gửi request.
 */
type ServiceOptions = {
	/** Thời gian chờ tối đa cho request (ms). */
	timeout?: number;

	/** Các header gửi kèm request. */
	headers?: Record<string, string>;

	/** Các tham số query gửi kèm URL. */
	params?: Record<string, string>;
};

/**
 * Hàm tạo URL trong môi trường phát triển.
 *
 * @param url - URL gốc cần xử lý.
 * @returns URL đầy đủ với thông tin hostname và port được cấu hình.
 */
let createUrl: (url: string) => URL;

if (process.env.NODE_ENV !== 'production') {
	// Nếu không phải môi trường production, cấu hình LOCAL_SERVER để hỗ trợ phát triển cục bộ
	const domainsPath = path.join(__dirname, '../../../domains');
	const LOCAL_SERVER = new Map<string, string>();

	// Duyệt qua các thư mục con để tìm file `.env` và lấy thông tin PORT
	for (const p of fs.readdirSync(domainsPath)) {
		const domainPath = path.join(domainsPath, p);
		if (fs.statSync(domainPath).isDirectory()) {
			for (const pp of fs.readdirSync(domainPath)) {
				const envFile = path.join(domainPath, pp, '.env');
				if (fs.existsSync(envFile)) {
					const cfg = parse(fs.readFileSync(envFile, 'utf-8'));
					if (cfg.PORT) {
						LOCAL_SERVER.set(`${p}/${pp}`, cfg.PORT);
					}
				}
			}
		}
		console.debug('LOCAL_SERVER', LOCAL_SERVER);
	}

	/// Hàm tạo URL trong môi trường phát triển
	createUrl = function (url: string) {
		const u = new URL(url, process.env.SERVICE_GATEWAY);
		const segments = u.pathname.split('/');
		const port = LOCAL_SERVER.get(`${segments[1]}/${segments[2]}`);
		if (port) {
			u.pathname = segments.slice(3).join('/');
			u.hostname = 'localhost';
			u.port = port;
		}
		return u;
	};
} else {
	// Hàm tạo URL trong môi trường production.
	createUrl = function (url: string) {
		return new URL(url, process.env.SERVICE_GATEWAY);
	};
}

/**
 * Hàm thực hiện một request HTTP.
 *
 * @template T - Kiểu dữ liệu trả về.
 * @param method - Phương thức HTTP (GET, POST, PUT, DELETE).
 * @param url - URL của request.
 * @param data - Dữ liệu gửi kèm (nếu có).
 * @param options - Các tùy chọn cho request.
 * @returns Kết quả trả về từ server.
 */
async function request<T>(
	method: string,
	url: string,
	data?: Record<string, any>,
	options?: ServiceOptions,
): Promise<T> {
	const fullUrl = createUrl(url);
	const { timeout, headers = {}, params } = options || {};

	// Thêm query params vào URL nếu có
	if (params) {
		for (const key in params) {
			fullUrl.searchParams.append(key, params[key]!);
		}
	}

	// Tạo một AbortController để hủy request nếu quá thời gian chờ
	let controller: AbortController, timeoutId: NodeJS.Timeout;
	if (timeout) {
		controller = new AbortController();
		timeoutId = setTimeout(() => {
			controller.abort();
		}, timeout);
	}

	try {
		// Cấu hình các header mặc định
		headers['Content-Type'] = 'application/json';
		headers['Cache-Control'] = 'no-cache';

		// Cấu hình các tùy chọn cho fetch
		const fetchOptions: RequestInit = {
			method,
			headers,
			body: data ? JSON.stringify(data) : undefined,
		};
		if (controller!) fetchOptions.signal = controller.signal;

		// Gửi request và nhận phản hồi
		const response = await fetch(fullUrl.toString(), fetchOptions);

		// Hủy timeout nếu request thành công
		if (timeoutId!) clearTimeout(timeoutId);

		// Kiểm tra xem phản hồi có thành công hay không
		if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);

		// Xử lý dữ liệu trả về dựa trên Content-Type
		const contentType = response.headers.get('Content-Type') || '';
		if (contentType.includes('application/json')) {
			return (await response.json()) as T;
		} else {
			return (await response.text()) as unknown as T;
		}
	} catch (error: any) {
		if (timeoutId!) clearTimeout(timeoutId);
		if (error.name === 'AbortError') {
			throw new Error('Request timed out');
		}
		throw error;
	}
}

/**
 * `Service` cung cấp các phương thức HTTP để gọi các service nội bộ
 */
const Service = {
	/**
	 * Gửi request GET.
	 *
	 * @template T - Kiểu dữ liệu trả về.
	 * @param url - URL của request.
	 * @param params - Các tham số query gửi kèm URL.
	 * @param options - Các tùy chọn cho request.
	 * @returns Kết quả trả về từ server.
	 */
	get<T>(
		url: string,
		params?: Record<string, any>,
		options?: ServiceOptions,
	): Promise<T> {
		options = options || {};
		options.params = params;
		return request<T>('GET', url, undefined, options);
	},

	/**
	 * Gửi request POST.
	 *
	 * @template T - Kiểu dữ liệu trả về.
	 * @param url - URL của request.
	 * @param data - Dữ liệu gửi kèm.
	 * @param options - Các tùy chọn cho request.
	 * @returns Kết quả trả về từ server.
	 */
	post<T>(
		url: string,
		data?: Record<string, any>,
		options?: ServiceOptions,
	): Promise<T> {
		return request<T>('POST', url, data, options);
	},

	/**
	 * Gửi request PUT.
	 *
	 * @template T - Kiểu dữ liệu trả về.
	 * @param url - URL của request.
	 * @param data - Dữ liệu gửi kèm.
	 * @param options - Các tùy chọn cho request.
	 * @returns Kết quả trả về từ server.
	 */
	put<T>(
		url: string,
		data?: Record<string, any>,
		options?: ServiceOptions,
	): Promise<T> {
		return request<T>('PUT', url, data, options);
	},

	/**
	 * Gửi request DELETE.
	 *
	 * @template T - Kiểu dữ liệu trả về.
	 * @param url - URL của request.
	 * @param data - Dữ liệu gửi kèm.
	 * @param options - Các tùy chọn cho request.
	 * @returns Kết quả trả về từ server.
	 */
	delete<T>(
		url: string,
		data?: Record<string, any>,
		options?: ServiceOptions,
	): Promise<T> {
		return request<T>('DELETE', url, data, options);
	},

	/**
	 * Gửi request GET an toàn (xử lý lỗi).
	 *
	 * @template T - Kiểu dữ liệu trả về.
	 * @param url - URL của request.
	 * @param params - Các tham số query gửi kèm URL.
	 * @param options - Các tùy chọn cho request.
	 * @returns Kết quả trả về từ server hoặc `undefined` nếu xảy ra lỗi.
	 */
	safe_get<T>(
		url: string,
		params?: Record<string, any>,
		options?: ServiceOptions,
	): Promise<T> {
		return safe(() => this.get<T>(url, params, options), undefined as T);
	},

	/**
	 * Gửi request POST an toàn (xử lý lỗi).
	 *
	 * @template T - Kiểu dữ liệu trả về.
	 * @param url - URL của request.
	 * @param data - Dữ liệu gửi kèm.
	 * @param options - Các tùy chọn cho request.
	 * @returns Kết quả trả về từ server hoặc `undefined` nếu xảy ra lỗi.
	 */
	safe_post<T>(
		url: string,
		data?: Record<string, any>,
		options?: ServiceOptions,
	): Promise<T> {
		return safe(() => this.post<T>(url, data, options), undefined as T);
	},

	/**
	 * Gửi request PUT an toàn (xử lý lỗi).
	 *
	 * @template T - Kiểu dữ liệu trả về.
	 * @param url - URL của request.
	 * @param data - Dữ liệu gửi kèm.
	 * @param options - Các tùy chọn cho request.
	 * @returns Kết quả trả về từ server hoặc `undefined` nếu xảy ra lỗi.
	 */
	safe_put<T>(
		url: string,
		data?: Record<string, any>,
		options?: ServiceOptions,
	): Promise<T> {
		return safe(() => this.put<T>(url, data, options), undefined as T);
	},

	/**
	 * Gửi request DELETE an toàn (xử lý lỗi).
	 *
	 * @template T - Kiểu dữ liệu trả về.
	 * @param url - URL của request.
	 * @param data - Dữ liệu gửi kèm.
	 * @param options - Các tùy chọn cho request.
	 * @returns Kết quả trả về từ server hoặc `undefined` nếu xảy ra lỗi.
	 */
	safe_delete<T>(
		url: string,
		data?: Record<string, any>,
		options?: ServiceOptions,
	): Promise<T> {
		return safe(() => this.delete<T>(url, data, options), undefined as T);
	},
};

export default Service;
