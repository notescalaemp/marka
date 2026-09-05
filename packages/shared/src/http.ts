import { NextResponse, type NextRequest } from "next/server";
import { ZodError } from "zod";
import { AppError } from "./errors";

type Envelope<T> = { data: T; meta?: Record<string, unknown> };

export function ok<T>(data: T, meta?: Record<string, unknown>, status = 200) {
  const body: Envelope<T> = meta ? { data, meta } : { data };
  return NextResponse.json(body, { status });
}

export function created<T>(data: T) {
  return ok(data, undefined, 201);
}

export function noContent() {
  return new NextResponse(null, { status: 204 });
}

// Never leak internals: unknown errors become a generic 500 message, the
// real error is only logged server-side.
export function fail(error: unknown) {
  if (error instanceof AppError) {
    return NextResponse.json(
      { error: { code: error.code, message: error.message, details: error.details } },
      { status: error.status }
    );
  }

  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: {
          code: "validation_error",
          message: "Dados inválidos",
          details: error.flatten(),
        },
      },
      { status: 400 }
    );
  }

  console.error(error);
  return NextResponse.json(
    { error: { code: "internal_error", message: "Erro interno" } },
    { status: 500 }
  );
}

type RouteHandler = (req: NextRequest, ctx: { params: Promise<Record<string, string>> }) => Promise<NextResponse>;

export function withHandler(handler: RouteHandler): RouteHandler {
  return async (req, ctx) => {
    try {
      return await handler(req, ctx);
    } catch (error) {
      return fail(error);
    }
  };
}

export function parsePagination(searchParams: URLSearchParams) {
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize")) || 20));
  return { page, pageSize, skip: (page - 1) * pageSize, take: pageSize };
}
