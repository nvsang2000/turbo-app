# example-service

Service mẫu được thiết kế để minh họa cách tổ chức và triển khai một service trong dự án.

## Mục đích

- Minh họa cách tổ chức mã nguồn trong một service.
- Cung cấp ví dụ về cách triển khai API RESTful.

## Công nghệ sử dụng

- **Bun**: Runtime JavaScript/TypeScript.
- **TypeScript**: Ngôn ngữ lập trình.
- **Elysia**: Framework web.
- **Drizzle ORM**: ORM cho cơ sở dữ liệu PostgreSQL.
- **TurboRepo**: Công cụ quản lý monorepo.

## Cấu trúc thư mục

```
example-service/
├── migrations/              # Thư mục chứa các migration
├── src/                     # Mã nguồn chính
│   ├── @types/              # Định nghĩa các kiểu TypeScript
│   ├── controllers/         # Các controller xử lý logic
│   ├── db/                  # Định nghĩa bảng cơ sở dữ liệu
│   ├── middleware/          # Middleware (nếu có)
│   ├── routes/              # Định nghĩa các route
│   ├── app.ts               # Khởi tạo ứng dụng Elysia
│   ├── db.ts                # Kết nối cơ sở dữ liệu
│   ├── server.ts            # Điểm bắt đầu của service
├── .env                     # Biến môi trường
├── bunfig.toml              # Cấu hình Bun
├── drizzle.config.ts        # Cấu hình Drizzle ORM
```

## Cấu hình môi trường

Các biến môi trường được định nghĩa trong file `.env`:

```sh
# Cổng mà dịch vụ sẽ chạy
PORT=3000

# Địa chỉ endpoint của service, sử dụng khi gọi API trong nội bộ
SERVICE_GATEWAY=http://service.localhost:3000

# URL kết nối tới cơ sở dữ liệu
DATABASE_URL=postgres://postgres:postgres@localhost:5432/example

# URL kết nối tới RabbitMQ server
AMQP_URL=amqp://localhost

# Mức log: trace, debug, info, warn, error, fatal
LOG_LEVEL=info

# Bật/tắt logger
LOG_ENABLED=true

# Tên chương trình
APP_NAME=my-service
```

## Cách triển khai cơ sở dữ liệu

Dự án sử dụng **Drizzle ORM** để quản lý cơ sở dữ liệu. Các lệnh chính:

- **Cài đặt thư viện cho môi trường linux**:

  ```bash
  sudo apt-get install graphicsmagick ghostscript
  ```

## Truy cập

```bash
# Endpoint API
http://localhost:3000

# Swagger UI
http://localhost:3000/swagger
```
