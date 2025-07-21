import amqp from 'amqplib';
import { EventEmitter } from 'events';
import { serialize, deserialize } from 'bun:jsc';

/**
 * Interface cơ bản cho event message
 * Các event cụ thể sẽ extend interface này và thêm các trường riêng
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface EventMessage {}

/**
 * Khởi tạo và cấu hình event bus sử dụng RabbitMQ
 * @param mqUrl URL kết nối tới RabbitMQ server
 * @param exchange Tên exchange sẽ sử dụng
 * @param options Các tùy chọn cho exchange và queue
 * @returns EventBus instance với các phương thức emit và on
 */
export default async function (
	mqUrl: string,
	exchange: string,
	options: {
		durable: boolean; // Queue và exchange có tồn tại sau khi restart
		persistent: boolean; // Message có được lưu xuống disk
	} = { durable: false, persistent: false },
) {
	const { durable, persistent } = options;
	const set = new Set<string>(); // Lưu các event đã đăng ký
	const ev = new EventEmitter();

	// Khởi tạo kết nối và channel
	const conn = await amqp.connect(mqUrl);
	const ch = await conn.createChannel();

	// Khai báo exchange kiểu direct
	await ch.assertExchange(exchange, 'direct', { durable });

	// Tạo queue tạm thời và duy nhất cho consumer này
	const q = await ch.assertQueue('', {
		exclusive: true,
		durable,
	});

	// Thiết lập consumer để nhận message
	ch.consume(
		q.queue,
		(msg) => {
			if (!msg) return;
			// Decode message và emit event local
			const data = deserialize(msg.content);
			ev.emit(data[1], data[0], data[1], data[2]);
		},
		{ noAck: true }, // Tự động ack message
	);

	return {
		/**
		 * Getter để truy cập connection instance
		 */
		get amqp() {
			return conn;
		},

		/**
		 * Phát event
		 * @param eventName Tên event
		 * @param message Nội dung message
		 */
		emit<T extends EventMessage>(eventName: string, message: T) {
			ch.publish(
				exchange,
				eventName,
				Buffer.from(serialize([message, eventName, new Date()])),
				{
					persistent, // Message có được lưu xuống disk không
				},
			);
		},

		/**
		 * Đăng ký handler cho event
		 * @param eventName Tên event cần lắng nghe
		 * @param handler Hàm xử lý khi nhận được event
		 */
		async on<T extends EventMessage>(
			eventName: string,

			/**
			 * Hàm xử lý khi nhận được event
			 * @param msg Nội dung message
			 * @param eventName Tên event
			 * @param timestamp Thời gian phát event
			 */
			handler: (msg: T, eventName: string, timestamp: Date) => Promise<void>,
		): Promise<void> {
			// Bind queue với event nếu chưa bind
			if (!set.has(eventName)) {
				set.add(eventName);
				await ch.bindQueue(q.queue, exchange, eventName);
			}
			// Đăng ký handler local
			ev.on(eventName, handler);
		},
	};
}
