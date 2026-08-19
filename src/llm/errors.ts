/**
 * Loi tu viec goi Anthropic API that bai (network, timeout, rate limit, auth...).
 * Middleware (src/server/app.ts) phan biet loi nay voi loi input thuong de tra 500
 * thay vi 400 — day la loi he thong, khong phai loi nguoi dung nhap sai.
 */
export class LlmApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LlmApiError';
  }
}
