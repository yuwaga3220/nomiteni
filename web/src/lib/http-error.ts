// web/src/lib/http-error.ts
// HTTP エラー
export class HttpError extends Error {
  // コンストラクタ
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
