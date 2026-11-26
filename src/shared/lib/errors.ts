export class HttpError extends Error {
  readonly status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = 'HttpError'
    this.status = status
  }
}
export const errorMessage = (error: unknown) =>
  error instanceof Error
    ? error.message
    : 'Ha ocurrido un error. Inténtalo de nuevo.'
