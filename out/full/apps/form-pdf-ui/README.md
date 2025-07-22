# System Dashboard

Dashboard quản lý hệ thống.

## Cài đặt

```bash
# Cài đặt
bun install
```

## Phát triển

```bash
# Chạy môi trường development
bun run dev

# Chạy Storybook
bun run storybook
```

## Build

```bash
# Build cho production
bun run build

# Build và compile thành binary
bun run compile
```

## Cấu trúc thư mục

```
public/				 # www root
  ├── assets/    	 # Hình ảnh, dữ liệu, ...
  ├── locales/       # Các tập tin ngôn ngữ
src/
  ├── @types/   	 # TypeScript type definitions
  ├── components/    # React components
  ├── lib/           # Utilities và shared logic
  ├── pages/         # Các trang
  └── styles/        # Css
```

## Biến Môi trường

```env
VITE_PORT=3000              # Port cho development server
VITE_APP_VERSION=           # Version của ứng dụng
```

## Scripts

- `dev`: Chạy development server với Vite
- `build`: Build ứng dụng cho production
- `compile`: Build và compile thành binary
- `storybook`: Chạy Storybook development server
- `build-storybook`: Build Storybook static files
- `clean`: Xóa thư mục build
