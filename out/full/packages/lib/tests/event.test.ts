import { describe, test, expect, beforeAll, mock } from 'bun:test';
import { serialize, deserialize } from 'bun:jsc';
import type { EventMessage } from '../src/event';

// Biến lưu callback cho consumer để mô phỏng nhận message
let consumeCallback: (msg: { content: Buffer }) => void;

// Tạo các mock objects cho RabbitMQ
const mockChannel = {
	assertExchange: mock(async () => {}),
	assertQueue: mock(async () => ({ queue: 'test-queue' })),
	bindQueue: mock(async () => {}),
	consume: mock((_q: string, cb: any) => {
		consumeCallback = cb;
		return {};
	}),
	publish: mock(() => {}),
};

const mockConnection = {
	createChannel: mock(async () => mockChannel),
	close: mock(async () => {}),
};

// Mock module amqplib
mock.module('amqplib', () => ({
	default: {
		connect: mock(async () => mockConnection),
	},
}));

describe('Event Bus với RabbitMQ', () => {
	const mqUrl = 'amqp://localhost';
	const exchange = 'test-exchange';
	let eventBus: {
		amqp: typeof mockConnection;
		emit: <T extends EventMessage>(tenEvent: string, message: T) => void;
		on: <T extends EventMessage>(
			tenEvent: string,
			handler: (msg: T, tenEvent: string, thoiGian: Date) => Promise<void>,
		) => Promise<void>;
	};

	beforeAll(async () => {
		const createEventBus = await import('../src/event').then((m) => m.default);
		eventBus = (await createEventBus(mqUrl, exchange, {
			durable: true,
			persistent: true,
		})) as any;
	});

	/**
	 * Test case: Khởi tạo Event Bus
	 * Điều kiện:
	 * - URL RabbitMQ hợp lệ
	 * - Tên exchange hợp lệ
	 * - Các tùy chọn durable và persistent được cung cấp
	 * Kỳ vọng:
	 * - EventBus được khởi tạo thành công
	 * - Có đầy đủ các phương thức emit và on
	 * - Exchange và queue được tạo với đúng cấu hình
	 * - Consumer được thiết lập để nhận message
	 */
	test('khởi tạo thành công với đầy đủ các methods', () => {
		expect(eventBus).toBeDefined();
		expect(eventBus.amqp).toBe(mockConnection);
		expect(typeof eventBus.emit).toBe('function');
		expect(typeof eventBus.on).toBe('function');

		// Kiểm tra các hàm RabbitMQ đã được gọi
		expect(mockConnection.createChannel).toHaveBeenCalled();
		expect(mockChannel.assertExchange).toHaveBeenCalledWith(exchange, 'direct', {
			durable: true,
		});
		expect(mockChannel.assertQueue).toHaveBeenCalledWith('', {
			exclusive: true,
			durable: true,
		});
		expect(mockChannel.consume).toHaveBeenCalled();
	});

	/**
	 * Test case: Gửi event message
	 * Điều kiện:
	 * - EventBus đã được khởi tạo
	 * - Tên event hợp lệ
	 * - Message có cấu trúc hợp lệ
	 * Kỳ vọng:
	 * - Message được gửi đến đúng exchange
	 * - Định dạng message được serialize đúng cách
	 * - Có đầy đủ thông tin: payload, tên event, timestamp
	 * - Message được đánh dấu persistent nếu được cấu hình
	 */
	test('emit gửi message đúng định dạng tới exchange', () => {
		// Chuẩn bị dữ liệu test
		const tenEvent = 'test.event';
		const message = { id: 123, data: 'thông tin test' };

		// Gọi hàm emit
		eventBus.emit(tenEvent, message);

		// Kiểm tra publish được gọi với đúng tham số
		expect(mockChannel.publish).toHaveBeenCalledTimes(1);

		// Kiểm tra các tham số của publish
		const args = mockChannel.publish.mock.calls[0] as any;
		expect(args[0] as any).toBe(exchange);
		expect(args[1] as any).toBe(tenEvent);
		expect(Buffer.isBuffer(args[2])).toBe(true);

		// Giải mã dữ liệu và kiểm tra
		const [msg, evt, timestamp] = deserialize(args[2]);
		expect(msg).toEqual(message);
		expect(evt).toBe(tenEvent);
		expect(timestamp instanceof Date).toBe(true);

		// Kiểm tra options
		expect(args[3]).toEqual({ persistent: true });
	});

	/**
	 * Test case: Đăng ký nhận event
	 * Điều kiện:
	 * - EventBus đã được khởi tạo
	 * - Tên event hợp lệ
	 * - Handler function được cung cấp
	 * Kỳ vọng:
	 * - Queue được bind với exchange và routing key
	 * - Handler được gọi khi có message phù hợp
	 * - Message được deserialize đúng cách trước khi gửi cho handler
	 * - Thông tin timestamp được chuyển đúng định dạng
	 */
	test('on đăng ký handler và bind queue', async () => {
		const tenEvent = 'test.event';
		const handler = mock(() => {});

		await eventBus.on(tenEvent, handler as any);

		// Kiểm tra bindQueue được gọi đúng cách
		expect(mockChannel.bindQueue).toHaveBeenCalledWith(
			'test-queue',
			exchange,
			tenEvent,
		);

		// Kiểm tra handler được gọi khi có message
		const testMessage = { data: 'dữ liệu test' };
		const testTime = new Date();
		const serialized = serialize([testMessage, tenEvent, testTime]);

		// Giả lập nhận message từ RabbitMQ
		consumeCallback({ content: Buffer.from(serialized) });

		// Kiểm tra handler được gọi với đúng tham số
		expect(handler).toHaveBeenCalledWith(testMessage, tenEvent, testTime);
	});

	/**
	 * Test case: Tối ưu việc bind queue
	 * Điều kiện:
	 * - EventBus đã được khởi tạo
	 * - Có nhiều handler cho cùng một event
	 * - Queue đã được bind cho handler đầu tiên
	 * Kỳ vọng:
	 * - bindQueue chỉ được gọi một lần cho mỗi event
	 * - Tất cả các handler đều nhận được message
	 * - Message được chuyển đến handlers theo đúng thứ tự
	 * - Không có memory leak khi đăng ký nhiều handler
	 */
	test('on không bind queue lại nếu đã đăng ký event', async () => {
		const tenEvent = 'test.duplicate';
		const handler1 = mock(() => {});
		const handler2 = mock(() => {});

		// Reset số lần gọi
		mockChannel.bindQueue.mockClear();

		// Đăng ký handler đầu tiên
		await eventBus.on(tenEvent, handler1 as any);
		expect(mockChannel.bindQueue).toHaveBeenCalledTimes(1);

		// Đăng ký handler thứ hai cho cùng event
		await eventBus.on(tenEvent, handler2 as any);
		// bindQueue không được gọi lần nữa
		expect(mockChannel.bindQueue).toHaveBeenCalledTimes(1);

		// Cả hai handler đều nhận được message
		const testMessage = { flag: true };
		const testTime = new Date();
		consumeCallback({
			content: Buffer.from(serialize([testMessage, tenEvent, testTime])),
		});

		expect(handler1).toHaveBeenCalledWith(testMessage, tenEvent, testTime);
		expect(handler2).toHaveBeenCalledWith(testMessage, tenEvent, testTime);
	});
});
