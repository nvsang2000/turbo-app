import pino from 'pino';

/**
 * Xác định mức độ ghi log dựa vào biến môi trường
 * - Nếu có LOG_LEVEL: sử dụng giá trị đó
 * - Nếu không: trong production dùng 'info', còn lại dùng 'trace'
 *
 * Các mức độ (từ ít đến nhiều):
 * fatal < error < warn < info < debug < trace
 */
const level =
	process.env.LOG_LEVEL ||
	(process.env.NODE_ENV === 'production' ? 'info' : 'trace');

/**
 * Kiểm tra xem có đang chạy ở môi trường production không
 */
const isProd = process.env.NODE_ENV === 'production';

/**
 * Khởi tạo logger với cấu hình dựa trên môi trường
 * @param options - Cấu hình logger
 * @param destination - Đích ghi log (mặc định là stdout)
 */
const logger = pino(
	{
		level, // Mức độ log từ biến môi trường hoặc mặc định
		enabled: !!process.env.LOG_ENABLED, // Bật/tắt logger dựa vào biến môi trường
		base: {
			pid: process.pid, // Thêm process ID vào mỗi log
			serviceName: process.env.APP_NAME || 'service', // Tên service từ biến môi trường hoặc mặc định
		},
		timestamp: isProd
			? pino.stdTimeFunctions.epochTime // Timestamp dạng số cho production (hiệu năng tốt hơn)
			: pino.stdTimeFunctions.isoTime, // Timestamp dạng ISO cho development (dễ đọc hơn)
		formatters: isProd ? undefined : { level: (label) => ({ level: label }) }, // Format level log khi ở môi trường dev
		transport: isProd
			? undefined // Không dùng transport trong production để tối ưu hiệu năng
			: {
					target: 'pino-pretty', // Format log đẹp hơn khi dev
					level,
					options: {
						colorize: true, // Thêm màu sắc cho log
						translateTime: 'SYS:standard', // Format thời gian dễ đọc
					},
				},
	},
	isProd ? pino.destination({ fd: 1 }) : undefined, // Trong production: ghi trực tiếp ra stdout để tối ưu hiệu năng
);

/**
 * Xuất logger để sử dụng trong ứng dụng
 * Ví dụ sử dụng:
 * - logger.info('Thông báo bình thường')
 * - logger.error({ err }, 'Đã xảy ra lỗi')
 * - logger.debug({ data }, 'Dữ liệu debug')
 */
export default logger;
