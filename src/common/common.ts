import { Response } from "express";
import * as statusCode from "http-status-codes";

export function handleError(res: Response, err: any) {
  console.error("**** error", err);
  if (typeof err.code === "string" && err.code.includes("auth/")) {
    return res
      .status(httpStatusCode.UNPROCESSABLE_ENTITY)
      .send({ code: httpStatusCode.CONFLICT, message: err.message });
  }

  return res
    .status(httpStatusCode.INTERNAL_SERVER_ERROR)
    .send({ code: httpStatusCode.INTERNAL_SERVER_ERROR, message: `${err.message || "Internal Server Error"}` });
}

export function respondError(res: Response, code: number, message: string | object | [] | undefined) {
  let errors = [{ code, message: message || "Internal Server Error" }];

  if (Array.isArray(message)) {
    errors = message;
  }

  return res.status(code).json({ errors });
}

export function respondSuccess(res: Response, data: object) {
  const code = Object.keys(data).length ? httpStatusCode.CREATED : httpStatusCode.OK;

  return res.status(code).json(data);
}

export const httpStatusCode = statusCode;
