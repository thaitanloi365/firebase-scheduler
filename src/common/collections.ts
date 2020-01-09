import * as admin from "firebase-admin";

export const notificationsCollection = () => admin.firestore().collection("/notifcations");
export const devicesCollection = () => admin.firestore().collection("/devices");
export const failureCollection = () => admin.firestore().collection("/failure");
