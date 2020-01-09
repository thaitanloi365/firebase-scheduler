import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript
//
admin.initializeApp();

interface IDevice {
  token: string;
  platform: "iOS" | "Android";
  is_sent: boolean;
  retry_times: number;
  should_delete: boolean;
}
interface INotification {
  id: string;
  devices: Array<IDevice>;
  title: string;
  body: Object;
  payload: Object;
  icon: string;
  created_at: number;
  updated_at: number;
}

const notificationCollection = admin.firestore().collection("/notifcations");

export const push_notification = functions.https.onRequest(async (request, response) => {
  const { id, title, body, payload, icon } = request.body as INotification;
  const ts = new Date().getMilliseconds();
  const doc = {
    id,
    title,
    body,
    payload,
    icon,
    retry_times: 1,
    created_at: ts,
    updated_at: ts,
    is_sent: false
  };
  try {
    await notificationCollection.add(doc);
    response.status(200).send("Added to queue");
  } catch (error) {
    console.error("push_notification error", error);
    response.status(500).send(error);
  }
});

export const onNotificationWrite = functions.firestore
  .document("notifcations/{id}")
  .onWrite(async (change, context) => {
    const newValue = change.after.data() as INotification;
    // const previousValue = change.before.data() as INotification;

    const isCreate = !change.before.exists && change.after.exists;
    const isUpdate = change.before.exists && change.after.exists;

    if (isCreate || isUpdate) {
      const payload = {
        notification: {
          title: newValue.title,
          body: newValue.body
        }
      };
      if (typeof newValue.icon === "string" && newValue.icon.startsWith("http")) {
        // @ts-ignore
        payload.notification.icon = newValue.icon;
      }

      const validDevices = newValue.devices.filter(d => d.retry_times < 4 && !d.is_sent);
      const ts = new Date().getMilliseconds();

      console.log(`********* ${isCreate ? "onCreate" : "onUpdate"} **********`, validDevices, payload);
      console.log("********* validDevices: ", validDevices);
      console.log("********* payload: ", payload);

      const updateDevices = await sendPush(validDevices, payload);
      const updateValue = Object.assign(newValue, { devices: updateDevices, updated_at: ts });
      await change.after.ref.update(updateValue);
      // onCreate
    } else if (change.before.exists && !change.after.exists) {
      // onDelete
    }
  });

function sendPush(devices: Array<IDevice>, payload: Object) {
  return new Promise((resolve, reject) => {
    const devicesCopy = Array.from(devices).map(d => Object.assign(d, { is_sent: false, should_delete: false }));
    const tokens = devicesCopy.map(d => d.token);
    admin
      .messaging()
      .sendToDevice(tokens, payload)
      .then(response => {
        response.results.forEach((result, index) => {
          const error = result.error;
          const device = devicesCopy[index];
          if (error) {
            console.error("Failure sending notification to device", device, error);
            // Cleanup the tokens who are not registered anymore.
            if (
              error.code === "messaging/invalid-registration-token" ||
              error.code === "messaging/registration-token-not-registered"
            ) {
              devicesCopy[index] = Object.assign(device, { should_delete: true });
            } else {
              devicesCopy[index] = Object.assign(device, {
                is_sent: false,
                retry_times: (device.retry_times || 1) + 1
              });
            }
          } else {
            devicesCopy[index] = Object.assign(device, { is_sent: true });
          }
        });
        const updateDevices = devicesCopy.filter(d => d.should_delete);
        resolve(updateDevices);
      })
      .catch(error => {
        reject(error);
      });
  });
}
