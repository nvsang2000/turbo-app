import app from '@/app';

// Bắt đầu lắng nghe service
app.listen(process.env.PORT || 3000);

// Thành công
console.log(`Server is running at ${app.server?.hostname}:${app.server?.port}`);
