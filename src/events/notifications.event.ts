import * as functions from "firebase-functions";
import { IDevice, INotification } from "../common/type";
import { devicesCollection } from "../common/collections";
import { sendPush } from "../common/helper";

export const onNotificationWrite = functions.firestore
  .document("notifcations/{id}")
  .onWrite(async (change, context) => {
    const newValue = change.after.data() as INotification;
    // const previousValue = change.before.data() as INotification;

    const isCreate = !change.before.exists && change.after.exists;
    const isUpdate = change.before.exists && change.after.exists;

    if (isCreate || isUpdate) {
      const ref = await devicesCollection()
        .where("user_id", "==", newValue.user_id)
        .get();
      const devices: Array<IDevice> = [];
      ref.docs.forEach(device => {
        const d = device.data() as IDevice;
        if (d && d.token && d.user_id) {
          devices.push(d);
        }
      });

      await sendPush(devices, newValue);
      // onCreate
    } else if (change.before.exists && !change.after.exists) {
      // onDelete
    }
  });
