import type { NextFunction, Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { HttpError } from "../lib/http-error.js";
import type { CurrentUser } from "../types/express.js";

/** Находит пользователя по токену из заголовка Authorization: Bearer <token>. */
export async function auth(req: Request, _res: Response, next: NextFunction) {
  const header = req.header("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice("Bearer ".length).trim() : "";
  if (!token) {
    throw new HttpError(401, "Нужна авторизация");
  }

  const user = await prisma.user.findUnique({
    where: { token },
    include: { organization: true },
  });
  if (!user) {
    throw new HttpError(401, "Неизвестный токен");
  }

  req.user = {
    id: user.id,
    name: user.name,
    organizationId: user.organizationId,
    organizationName: user.organization.name,
  };
  next();
}

/** Текущий пользователь; в роутерах под auth он есть всегда. */
export function currentUser(req: Request): CurrentUser {
  if (!req.user) {
    throw new HttpError(401, "Нужна авторизация");
  }
  return req.user;
}
