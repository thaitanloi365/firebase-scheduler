import { Request, Response } from "express";
import { INotification } from "../common/type";
import { httpStatusCode, respondError, handleError, respondSuccess } from "../common/common";
import { notificationsCollection } from "../common/collections";

export async function create(req: Request, res: Response) {
  try {
    const { user_id, title, body, payload, icon } = req.body as INotification;

    if (!user_id) {
      return respondError(res, httpStatusCode.BAD_REQUEST, "User'id required");
    }

    if (!title) {
      return respondError(res, httpStatusCode.BAD_REQUEST, "Title required");
    }

    const ts = new Date().getMilliseconds();
    const doc: INotification = {
      user_id,
      title,
      body,
      payload,
      icon,

      created_at: ts,
      updated_at: ts,

      id: ts
    };
    await notificationsCollection().add(doc);
    return respondSuccess(res, doc);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function destroy(req: Request, res: Response) {
  try {
    const { id } = req.params;

    if (typeof id !== "string" || !id.length) {
      return respondError(res, httpStatusCode.BAD_REQUEST, "Notificaion's id required");
    }

    const doc = await notificationsCollection()
      .where("id", "==", id)
      .get();
    if (!doc.docs.length) {
      return respondError(res, httpStatusCode.NOT_FOUND, `Notificaion's id ${id} not found`);
    }
    await doc.docs[0].ref.delete();

    // @ts-ignore
    return respondSuccess(res, `Notificaion's id ${id} is deleted`);
  } catch (error) {
    return handleError(res, error);
  }
}
