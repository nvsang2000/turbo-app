# AZCloudSystem

Phần mềm quản lý doanh nghiệp

## Cấu trúc dự án

```
AZCloudSystem/
├── domains/                # Các nhóm service
│   ├── pos/             	# Các service dành cho pos
│   ├── shared/             # Các service dùng chung
│   ├── ├──example-service	# 1 microservice
│   ├── system/             # Các service dành cho phần quản lý
├── packages/               # Các package dùng chung
├── apps/                   # Các ứng dụng
│   ├── pos-dashboard		# Ứng dụng quản lý POS
│   ├── system-dashboard/   # Ứng dụng quản lý hệ thống
├── events/               	# Khai báo các sự kiện
├── docs/               	# Tài liệu
├── infra/               	# Các thành phần dùng cài đặt
├── tools/               	# Script hoặc tools để build
├── .vscode/                # Cấu hình VSCode
```

## Backend

- **Bun**: Runtime JavaScript/TypeScript.
- **TypeScript**: Ngôn ngữ lập trình.
- **Elysia**: Framework web.
- **Drizzle ORM**: ORM cho cơ sở dữ liệu PostgreSQL.
- **TurboRepo**: Công cụ quản lý monorepo.

## Frontend

- **React**: https://react.dev/learn
- **Vite**: https://vite.dev/guide/
- **Tailwind**: https://tailwindcss.com/
- **shadcn**: https://ui.shadcn.com/
- **Tailwind**: https://tailwindcss.com/

## Tài liệu - Kế hoạch

Dùng tài khoản gitlab được cấp để đăng nhập

- https://plane.azcpos.work/azcloudsystem
- https://outline.azcpos.work/
- https://azcloudsystem.pages.azcpos.work/azcloudsystem

## Hướng dẫn sử dụng

### 1. Tải về

```bash
git clone --recurse-submodules https://gitlab.azcpos.work/azcloudsystem/azcloudsystem.git
```

### 2. Cài đặt

```bash
bun install
```

### 3. Chạy trong môi trường phát triển

```bash
bun turbo run dev
```

### 4. Build

```bash
bun turbo run build
```

### 5. Compile

```bash
bun turbo run compile
```

## Các Quy Tắc

### 1. Cấu hình môi trường cần phải có cho mỗi service

Các biến môi trường được định nghĩa trong file `.env`:

```sh
# Cổng mà dịch vụ sẽ chạy
PORT=3000

# Địa chỉ endpoint của service, sử dụng khi gọi API trong nội bộ
SERVICE_GATEWAY=http://service.localhost:3000

# Địa chỉ endpoint của service dùng ở frontend
SERVICE_ENDPOINT=http://service.public

# URL kết nối tới cơ sở dữ liệu
DATABASE_URL=postgres://postgres:postgres@localhost:5432/example

/** URL kết nối tới RabbitMQ server */
AMQP_URL=amqp://localhost;

# Mức log: trace, debug, info, warn, error, fatal
LOG_LEVEL=info

# Bật/tắt logger
LOG_ENABLED=true

# Tên chương trình
APP_NAME=my-service
```

### 2. Tạo service mới

- Mỗi service sẽ là một thư mục nằm trong domains/[thư mục chức năng]/[service]
- Nếu service đó không cần phải chia sẽ cho cả nhóm thì sẽ tạo thành 1 repo riêng
- Để gọi một api trong service từ các service ta sẽ gọi như sau

```ts
import sv from '@repo/lib/service';

// Ví dụ về cách sử dụng service
try {
	console.log(
		await sv.get('shared/example-service/user/createUser', {
			name: 'Minh',
			email: 'minh@vnvn.com',
			age: 20,
		}),
	);
} catch (error) {
	console.log('Error', error);
}

// Gọi service không tung lỗi
console.log(await sv.safe_get('shared/example-service/user/createUser'));
```

- `shared/example-service` sẽ tương ứng với đường dẫn [thư mục chức năng]/[service]
- `/user/createUser` phần này là route khai báo riêng của service
- Trong file `.env` của mỗi service sẽ có biến `SERVICE_GATEWAY=http://service.public:3000`, đường dẫn này sẽ trỏ tới service chạy trên máy chủ và biến `PORT=35000` để quy định cổng service đó sẽ lắng nghe
- Khi gọi `sv.get("shared/example-service/user/createUser"` nếu code dưới local có các thư mục `shared/example-service/` đang chạy thì nó sẽ gọi tới `http://localhost:35000/user/createUser`. Trường hợp code local không có thư mục `shared/example-service/` (do dev không có quyền truy cập vào repo của service này) thì nó sẽ gọi tới `http://service.public:3000/shared/example-service/user/createUser`

### 3. Event

Sử dụng `@repo/lib/event` để tạo event giữa các service

```typescript
import createEventBus, { type EventMessage } from '@repo/lib/event';

// Khởi tạo kết nối EventBus
const eventBus = await createEventBus(
	'amqp://localhost', // URL kết nối RabbitMQ
	'ten-exchange', // Tên exchange
	{
		durable: true, // Exchange và queue tồn tại sau khi restart
		persistent: true, // Message được lưu xuống disk
	},
);
```

Định nghĩa event message

```typescript
// Định nghĩa interface cho event
interface OrderCreatedEvent extends EventMessage {
	data: {
		orderId: string;
		customerId: string;
		totalAmount: number;
		items: Array<{ id: string; quantity: number }>;
		createdAt: Date;
	};
}
```

Phát event (emit)

```typescript
// Service phát event
const orderCreated: OrderCreatedEvent = {
	data: {
		orderId: 'ORD-1234',
		customerId: 'CUST-5678',
		totalAmount: 100000,
		items: [
			{ id: 'ITEM-001', quantity: 2 },
			{ id: 'ITEM-002', quantity: 1 },
		],
		createdAt: new Date(),
	},
};

// Phát event với routing key là 'order.created'
eventBus.emit('order.created', orderCreated);
```

Đăng ký nhận event

```typescript
// Service lắng nghe event
await eventBus.on<OrderCreatedEvent>(
	'order.created',
	async (message, eventName, timestamp) => {
		console.log(`Nhận event ${eventName} lúc ${timestamp}`);
		console.log('Chi tiết đơn hàng:', message.data);

		// Xử lý nghiệp vụ...
	},
);
```

### 4. Logger

Import và sử dụng logger

```typescript
import logger from '@repo/lib/logger';

// Các mức độ log từ thấp đến cao
logger.trace('Chi tiết nhất, thường dùng để debug');
logger.debug('Thông tin hữu ích khi debug');
logger.info('Thông tin hoạt động bình thường');
logger.warn('Cảnh báo, có vấn đề nhưng không nghiêm trọng');
logger.error('Lỗi, cần xem xét');
logger.fatal('Lỗi nghiêm trọng, ứng dụng có thể dừng hoạt động');
```

### 5. Quản lý repo

- Mỗi `repo` sẽ có 3 branch chính
  - `main` bản hiện tại
  - `development` bản thử nghiệm
  - `production` bản hoàn thiện
- Dev sẽ rebase lại khi main thay đổi
- Dev commit code lên branch mới và tạo merge request
- Maintainer sẽ kiểm tra lại request trước khi đồng ý merge vào main
- Maintainer sẽ merge từ `main` qua `development`, `production` để tạo ra các bản thử nghiệm, bản hoàn thiện khi cần thiết
