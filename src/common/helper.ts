import * as admin from "firebase-admin";

import { IDevice, INotification, IFailure } from "../common/type";
import { devicesCollection, failureCollection } from "../common/collections";

export function sendPush(devices: Array<IDevice>, data: INotification) {
  return new Promise((resolve, reject) => {
    const tokens = devices.map(d => d.token);
    const payload: admin.messaging.MessagingPayload = {
      notification: {
        title: data.title,
        body: data.body
      }
    };

    if (typeof data.icon === "string" && data.icon.startsWith("http")) {
      // @ts-ignore
      payload.notification.icon = data.icon;
    }

    const options: admin.messaging.MessagingOptions = {
      priority: "high",
      timeToLive: 2419200
    };

    admin
      .messaging()
      .sendToDevice(tokens, payload, options)
      .then(response => {
        const tokensToRemove: Array<Promise<FirebaseFirestore.QuerySnapshot>> = [];
        const failedDevices: Array<Promise<FirebaseFirestore.DocumentReference>> = [];
        response.results.forEach((result, index) => {
          const error = result.error;
          const device = devices[index];

          if (error) {
            console.error("Failure sending notification to device", device, error);
            // Cleanup the tokens who are not registered anymore.
            if (
              error.code === "messaging/invalid-registration-token" ||
              error.code === "messaging/registration-token-not-registered"
            ) {
              tokensToRemove.push(
                devicesCollection()
                  .where("token", "==", device.token)
                  .get()
              );
            } else {
              const failure: IFailure = {
                device,
                notification: data,
                is_sent: false,
                retry_times: 1,
                message_id: result.messageId
              };
              failedDevices.push(failureCollection().add(failure));
            }
          } else {
            console.log("**** send to device success", device);
          }
        });

        return Promise.all([Promise.all(tokensToRemove), Promise.all(failedDevices)]);
        // const updateDevices = devicesCopy.filter(d => d.should_delete);
        // resolve(updateDevices);
      })
      .then(response => {
        var deletes = response[0].map(d => (d.docs.length ? d.docs[0].ref.delete() : null));
        return Promise.all(deletes);
      })
      .then(() => {
        console.log("**** sendPush done");
      })
      .catch(error => {
        reject(error);
      });
  });
}
