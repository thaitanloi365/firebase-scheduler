import { Request, Response } from "express";
import { IDevice } from "../common/type";
import { httpStatusCode, respondError, handleError, respondSuccess } from "../common/common";
import { devicesCollection } from "../common/collections";

export async function create(req: Request, res: Response) {
  try {
    const { platform, token = "", user_id = 0 } = req.body as IDevice;

    const validPlatform = platform === "Android" || platform === "iOS";
    if (!validPlatform) {
      return respondError(res, httpStatusCode.BAD_REQUEST, "Invalid platform should be iOS or Android");
    }

    if (typeof token !== "string" || !token.length) {
      return respondError(res, httpStatusCode.BAD_REQUEST, "Token required");
    }

    if (!user_id) {
      return respondError(res, httpStatusCode.BAD_REQUEST, "User's id required");
    }
    const doc: IDevice = {
      platform,
      token,
      user_id
    };

    await devicesCollection().add(doc);

    return respondSuccess(res, doc);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function destroy(req: Request, res: Response) {
  try {
    const { token, user_id = 0 } = req.params;

    if (typeof token !== "string" || !token.length) {
      return respondError(res, httpStatusCode.BAD_REQUEST, "Token required");
    }

    if (!user_id) {
      return respondError(res, httpStatusCode.BAD_REQUEST, "User'id required");
    }

    const doc = await devicesCollection()
      .where("user_id", "==", user_id)
      .where("token", "==", token)
      .get();

    if (!doc.docs.length) {
      return respondError(res, httpStatusCode.NOT_FOUND, `Device's token ${token} not found`);
    }
    await doc.docs[0].ref.delete();

    // @ts-ignore
    return respondSuccess(res, `Device's token ${token} is deleted`);
  } catch (error) {
    return handleError(res, error);
  }
}
