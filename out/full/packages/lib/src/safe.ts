/**
 * Hàm `safe` giúp thực thi một hàm bất đồng bộ và xử lý lỗi một cách an toàn.
 *
 * @template T - Kiểu dữ liệu trả về của hàm.
 * @param fn - Hàm bất đồng bộ cần thực thi.
 * @param fallback - Giá trị mặc định trả về nếu hàm `fn` gặp lỗi.
 * @returns Kết quả của hàm `fn` nếu thành công, hoặc `fallback` nếu xảy ra lỗi.
 *
 * @example
 * const result = await safe(async () => {
 *     // Logic bất đồng bộ
 *     return await fetchData();
 * }, defaultValue);
 */
export default async function safe<T>(
	fn: () => Promise<T>,
	fallback?: T,
): Promise<T> {
	try {
		// Thực thi hàm `fn` và trả về kết quả nếu thành công
		return await fn();
	} catch {
		// Trả về giá trị mặc định `fallback` nếu xảy ra lỗi
		return fallback!;
	}
}
