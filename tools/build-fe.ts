import { copyFile, mkdir, rm, readdir } from 'fs/promises';
import { join, parse } from 'path';
import { brotliCompress, gzip, deflate } from 'zlib';
import { promisify } from 'util';
import imagemin from 'imagemin';
import imageminWebp from 'imagemin-webp';
import optimizeImage from '@repo/lib/optimizeImage';

// Thiết lập môi trường
process.env.NODE_ENV = 'production';

// Chuyển đổi callback thành promise
const gzipAsync = promisify(gzip);
const deflateAsync = promisify(deflate);
const brotliCompressAsync = promisify(brotliCompress);

// Cấu hình build
interface BuildOptions {
	compressImages?: boolean;
	createWebP?: boolean;
	compressFiles?: boolean;
}

// Danh sách các file cần nén
const COMPRESS_EXTENSIONS = [
	'.js',
	'.css',
	'.html',
	'.json',
	'.xml',
	'.svg',
	'.txt',
] as const;

// Thêm danh sách định dạng ảnh có thể chuyển sang WebP
const CONVERTIBLE_TO_WEBP = ['.jpg', '.jpeg', '.png'] as const;

// Thêm định dạng ảnh cần tối ưu
const IMAGE_EXTENSIONS = [
	'.jpg',
	'.jpeg',
	'.png',
	'.webp',
	'.gif',
	'.svg',
] as const;

/**
 * Tạo phiên bản WebP của ảnh
 * @param sourcePath Đường dẫn ảnh nguồn
 * @param destPath Đường dẫn ảnh đích
 */
async function createWebPVersion(sourcePath: string, destPath: string) {
	try {
		const webpPath = destPath + '.webp';
		const buffer = await imagemin([sourcePath], {
			plugins: [
				imageminWebp({
					quality: 100,
					lossless: true,
					method: 6, // Mức độ nén cao nhất
				}),
			],
		});
		if ((await Bun.file(sourcePath).stat()).size < buffer[0]!.data.byteLength)
			return;
		await Bun.write(webpPath, buffer[0]!.data);
	} catch (error) {
		console.error(`Lỗi khi tạo WebP cho ${sourcePath}:`, error);
	}
}

/**
 * Tạo các phiên bản nén của file
 * @param sourcePath Đường dẫn file nguồn
 * @param destPath Đường dẫn file đích
 */
async function compressFile(sourcePath: string, destPath: string) {
	const content = await Bun.file(sourcePath).arrayBuffer();

	// Tạo các phiên bản nén
	const [brContent, gzContent, deflateContent] = await Promise.all([
		brotliCompressAsync(content),
		gzipAsync(content, {
			memLevel: 8,
			level: 9,
			windowBits: 15,
		}),
		deflateAsync(content, {
			memLevel: 8,
			level: 9,
			windowBits: 15,
		}),
	]);

	// Ghi các file nén
	await Promise.all([
		Bun.write(`${destPath}.br`, brContent.buffer),
		Bun.write(`${destPath}.gz`, gzContent),
		Bun.write(`${destPath}.deflate`, deflateContent),
	]);
}

/**
 * Copy thư mục và xử lý các file
 */
async function copyAndCompress(
	source: string,
	dest: string,
	options: BuildOptions,
) {
	try {
		// Tạo thư mục đích
		try {
			await mkdir(dest, { recursive: true });
		} catch {}

		// Đọc danh sách file
		const files = await readdir(source);

		// Xử lý từng file
		for (const file of files) {
			const sourcePath = join(source, file);
			const destPath = join(dest, file);

			try {
				if ((await Bun.file(sourcePath).stat()).isDirectory()) {
					await copyAndCompress(sourcePath, destPath, options);
					continue;
				}

				const ext = parse(file).ext.toLowerCase();
				if (options.compressImages && IMAGE_EXTENSIONS.includes(ext as any)) {
					// TODO: Hiện tại việc tối ưu hóa ảnh vẫn bị lỗi, tuy nhiên không ảnh hưởng, sẽ fix sau
					await optimizeImage(sourcePath, destPath);
					if (options.createWebP && CONVERTIBLE_TO_WEBP.includes(ext as any)) {
						await createWebPVersion(sourcePath, destPath);
					}
				} else if (
					options.compressFiles &&
					COMPRESS_EXTENSIONS.includes(ext as any)
				) {
					if (ext === '.json') {
						const content = JSON.parse(await Bun.file(sourcePath).text());
						await Bun.write(destPath, JSON.stringify(content));
					} else await copyFile(sourcePath, destPath);

					// Nén file
					await compressFile(destPath, destPath);
				} else {
					await copyFile(sourcePath, destPath);
				}
			} catch (error) {
				console.error(`Lỗi khi xử lý file ${file}:`, error);
			}
		}
	} catch (error) {
		console.error(`Lỗi khi xử lý thư mục ${source}:`, error);
		throw error;
	}
}

async function mergeLocales(source: string) {
	try {
		// Đọc danh sách file
		const files = await readdir(source);

		// Xử lý từng file
		for (const file of files) {
			const sourcePath = join(source, file);
			try {
				if ((await Bun.file(sourcePath).stat()).isDirectory()) {
					const namespace: Record<string, any> = {};
					const subFiles = await readdir(sourcePath);
					for (const subFile of subFiles) {
						if (!subFile.endsWith('.json')) continue;
						namespace[parse(subFile).name] = await Bun.file(
							join(sourcePath, subFile),
						).json();
					}
					await rm(sourcePath, { recursive: true });
					Bun.write(sourcePath + '.json', JSON.stringify(namespace));
				}
			} catch {}
		}
	} catch (error) {
		console.error(`Lỗi khi xử lý thư mục ${source}:`, error);
		throw error;
	}
}

/**
 * Hàm build chính
 */
async function main(options: BuildOptions = {}) {
	const buildOptions = {
		compressImages: true,
		createWebP: true,
		compressFiles: true,
		...options,
	};

	try {
		console.log('Bắt đầu quá trình build...');
		await rm('./build/public/stats.html', { force: true });
		await mergeLocales('./build/public/locales');
		await copyAndCompress('./build/public', './dist/public', buildOptions);
		console.log('Build hoàn thành thành công!');
	} catch (error) {
		console.error('Lỗi trong quá trình build:', error);
		process.exit(1);
	}
}

// Chạy build
main();
