/** Ошибка с HTTP-статусом: обработчик ошибок отдаёт её клиенту как есть. */
export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}
