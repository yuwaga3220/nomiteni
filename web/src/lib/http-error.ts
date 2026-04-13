// web/src/lib/http-error.ts
// HTTP Error Class定義

export class HttpError extends Error {
  // コンストラクタ
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
