import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import { mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import optimizeImage from '../src/optimizeImage';

/**
 * Test suite: Tối ưu hóa hình ảnh
 * Kiểm tra các chức năng:
 * - Tối ưu các định dạng ảnh khác nhau (JPEG, PNG, SVG)
 * - Xử lý các trường hợp lỗi
 * - Xử lý định dạng không được hỗ trợ
 */
describe('Tối ưu hóa hình ảnh', () => {
	const testDir = join(import.meta.dir, '__fixtures__');
	const outputDir = join(import.meta.dir, '__output__');

	/**
	 * Hook: Thiết lập môi trường test
	 * Điều kiện:
	 * - Tạo thư mục output để lưu các file test
	 * - Thư mục sẽ được tạo mới nếu chưa tồn tại
	 */
	beforeAll(async () => {
		await mkdir(outputDir, { recursive: true });
	});

	/**
	 * Hook: Dọn dẹp sau khi test
	 * Điều kiện:
	 * - Xóa toàn bộ thư mục output
	 * - Đảm bảo không còn file test nào tồn tại
	 */
	afterAll(async () => {
		await rm(outputDir, { recursive: true, force: true });
	});

	/**
	 * Test case: Tối ưu file JPEG
	 * Điều kiện:
	 * - File JPEG nguồn tồn tại
	 * - Thư mục đích đã được tạo
	 * Kỳ vọng:
	 * - Trả về true sau khi tối ưu
	 * - File đích tồn tại
	 * - Kích thước file đích nhỏ hơn hoặc bằng file nguồn
	 */
	test('nên tối ưu được file JPEG', async () => {
		const sourcePath = join(testDir, 'test.jpg');
		const destPath = join(outputDir, 'test-optimized.jpg');

		const result = await optimizeImage(sourcePath, destPath);

		expect(result).toBe(true);
		expect(await Bun.file(destPath).exists()).toBe(true);

		// Kiểm tra kích thước file đã được tối ưu
		const sourceSize = await Bun.file(sourcePath).size;
		const destSize = await Bun.file(destPath).size;
		expect(destSize).toBeLessThanOrEqual(sourceSize);
	});

	/**
	 * Test case: Tối ưu file PNG
	 * Điều kiện:
	 * - File PNG nguồn tồn tại
	 * - Thư mục đích đã được tạo
	 * Kỳ vọng:
	 * - Trả về true sau khi tối ưu
	 * - File đích tồn tại
	 */
	test('nên tối ưu được file PNG', async () => {
		const sourcePath = join(testDir, 'test.png');
		const destPath = join(outputDir, 'test-optimized.png');

		const result = await optimizeImage(sourcePath, destPath);

		expect(result).toBe(true);
		expect(await Bun.file(destPath).exists()).toBe(true);
	});

	/**
	 * Test case: Tối ưu file SVG
	 * Điều kiện:
	 * - File SVG nguồn tồn tại
	 * - Thư mục đích đã được tạo
	 * Kỳ vọng:
	 * - Trả về true sau khi tối ưu
	 * - File đích tồn tại
	 */
	test('nên tối ưu được file SVG', async () => {
		const sourcePath = join(testDir, 'test.svg');
		const destPath = join(outputDir, 'test-optimized.svg');

		const result = await optimizeImage(sourcePath, destPath);

		expect(result).toBe(true);
		expect(await Bun.file(destPath).exists()).toBe(true);
	});

	/**
	 * Test case: Xử lý định dạng không hỗ trợ
	 * Điều kiện:
	 * - File có định dạng không được hỗ trợ (BMP)
	 * Kỳ vọng:
	 * - Trả về false mà không xử lý file
	 */
	test('nên trả về false với định dạng không hỗ trợ', async () => {
		const sourcePath = join(testDir, 'test.bmp');
		const destPath = join(outputDir, 'test-optimized.bmp');

		const result = await optimizeImage(sourcePath, destPath);

		expect(result).toBe(false);
	});

	/**
	 * Test case: Xử lý file không tồn tại
	 * Điều kiện:
	 * - Đường dẫn file nguồn không tồn tại
	 * Kỳ vọng:
	 * - Ném ra lỗi
	 */
	test('nên ném lỗi khi file nguồn không tồn tại', async () => {
		const sourcePath = join(testDir, 'not-exist.jpg');
		const destPath = join(outputDir, 'not-exist-optimized.jpg');

		return expect(optimizeImage(sourcePath, destPath)).rejects.toThrow();
	});
});
