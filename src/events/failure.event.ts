import * as functions from "firebase-functions";
import { sendPush } from "../common/helper";
import { IFailure } from "../common/type";

export const onSentFailure = functions.firestore.document("failure/{id}").onWrite(async (change, context) => {
  const isCreate = !change.before.exists && change.after.exists;
  const isUpdate = change.before.exists && change.after.exists;

  if (isCreate || isUpdate) {
    const newValue = change.after.data() as IFailure;
    const { retry_times = 1 } = newValue;

    if (newValue.is_sent) {
      console.log("notification is sent");
      return Promise.resolve();
    }

    try {
      await sendPush([newValue.device], newValue.notification);
      await change.after.ref.update({ is_sent: true });
      return Promise.resolve();
    } catch (error) {
      await change.after.ref.update({ retry_times: retry_times + 1, is_sent: false });
      return Promise.reject(error);
    }
  }

  return Promise.resolve();
});
