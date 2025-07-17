declare module 'bun' {
	interface Env {
		/** Cổng mà dịch vụ sẽ chạy */
		PORT: number;

		/** Cổng mà dịch vụ cho vite */
		VITE_PORT: number;

		/** Tên chương trình */
		APP_NAME: string;

		/** URL kết nối tới RabbitMQ server */
		AMQP_URL: string;

		/** Địa chỉ endpoint của service, sử dụng khi gọi API trong nội bộ */
		SERVICE_GATEWAY: string;

		/** Địa chỉ endpoint của service dùng ở frontend */
		SERVICE_ENDPOINT: string;

		/** URL kết nối tới cơ sở dữ liệu */
		DATABASE_URL: string;

		/** Bật log */
		LOG_ENABLED: boolean;

		/** Mức độ log */
		LOG_LEVEL: string;
	}
}
