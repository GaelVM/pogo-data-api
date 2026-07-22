import type { ZodError } from 'zod'

export function paginationMeta(page: number, limit: number, total: number) {
  return {
    page,
    limit,
    total,
    pages: Math.ceil(total / limit),
  }
}

export function validationError(error: ZodError) {
  return {
    statusCode: 400,
    error: 'Bad Request',
    message: 'Los parámetros enviados no son válidos',
    details: error.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
    })),
  }
}
