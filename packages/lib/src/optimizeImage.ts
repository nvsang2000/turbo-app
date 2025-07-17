import imagemin, { type Result } from 'imagemin';
import imageminMozjpeg from 'imagemin-mozjpeg';
import imageminPngquant from 'imagemin-pngquant';
import imageminWebp from 'imagemin-webp';
import imageminGifsicle from 'imagemin-gifsicle';
import imageminSvgo from 'imagemin-svgo';
import path from 'path';

/**
 * TODO: Hiện tại việc tối ưu hóa ảnh vẫn bị lỗi, tuy nhiên không ảnh hưởng, sẽ fix sau
 * Tối ưu hóa hình ảnh không làm giảm chất lượng
 * Hàm này sẽ xử lý các định dạng ảnh phổ biến và tối ưu chúng mà không làm giảm chất lượng
 *
 * @param sourcePath Đường dẫn ảnh nguồn cần tối ưu
 * @param destPath Đường dẫn lưu ảnh sau khi đã tối ưu
 * @returns Promise<boolean> - true nếu tối ưu thành công, false nếu định dạng không được hỗ trợ
 * @throws Error nếu có lỗi trong quá trình tối ưu
 */
export default async function optimizeImage(
	sourcePath: string,
	destPath: string,
): Promise<boolean> {
	// Lấy phần mở rộng của file và chuyển về lowercase
	const ext = path.parse(sourcePath).ext.toLowerCase();

	// eslint-disable-next-line no-useless-catch
	try {
		// Kiểm tra xem file nguồn có tồn tại không
		const file = Bun.file(sourcePath);
		if (!(await file.exists())) throw new Error(`File not exists: ${sourcePath}`);

		// Kiểm tra định dạng file
		let buffer: Result[];
		switch (ext) {
			case '.jpg':
			case '.jpeg':
				// Tối ưu JPEG với mozjpeg
				// - progressive: true cho phép tải ảnh theo từng phần
				buffer = await imagemin([sourcePath], {
					plugins: [
						imageminMozjpeg({
							progressive: (await file.stat()).size > 10 * 1024, // Chỉ sử dụng progressive nếu file lớn hơn 10kb
						}),
					],
				});
				break;

			case '.png':
				// Tối ưu PNG với pngquant
				// - quality: [1, 1] đảm bảo chất lượng tối đa
				// - speed: 1 ưu tiên mức độ nén tốt nhất thay vì tốc độ
				buffer = await imagemin([sourcePath], {
					plugins: [
						imageminPngquant({
							quality: [1, 1], // Giữ chất lượng tối đa
							speed: 1, // Nén chậm nhất để đạt kết quả tốt nhất
						}),
					],
				});
				break;

			case '.gif':
				// Tối ưu GIF với gifsicle
				// - optimizationLevel: 3 là mức tối ưu cao nhất
				// - interlaced: true cho phép hiển thị ảnh dần dần
				buffer = await imagemin([sourcePath], {
					plugins: [
						imageminGifsicle({
							optimizationLevel: 3,
							interlaced: true,
						}),
					],
				});
				break;

			case '.webp':
				// Tối ưu WebP với chế độ không mất dữ liệu
				// - quality: 100 giữ nguyên chất lượng
				// - lossless: true đảm bảo không mất dữ liệu
				buffer = await imagemin([sourcePath], {
					plugins: [
						imageminWebp({
							quality: 100,
							lossless: true,
						}),
					],
				});
				break;

			case '.svg':
				// Tối ưu SVG với svgo
				// - removeViewBox: false giữ lại thuộc tính viewBox quan trọng
				// - preset-default: sử dụng các cài đặt tối ưu mặc định an toàn
				buffer = await imagemin([sourcePath], {
					plugins: [
						imageminSvgo({
							plugins: [
								{
									name: 'preset-default',
									params: {
										overrides: {
											removeViewBox: false,
										},
									},
								},
							],
						}),
					],
				});
				break;

			default:
				// Trả về false nếu định dạng không được hỗ trợ
				return false;
		}

		// Ghi file đã tối ưu vào đường dẫn đích
		await Bun.write(destPath, buffer[0]!.data);
		return true;
	} catch (error) {
		// Log lỗi
		// console.debug(`Optimize Image Error ${sourcePath}:`, error);
		throw error;
	}
}
