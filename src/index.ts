import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as express from "express";
import * as cors from "cors";
import * as bodyParser from "body-parser";
import deviceRoutes from "./routes/devices.route";
import notificationRoutes from "./routes/notification.route";

admin.initializeApp();

const app = express();

app.use(bodyParser.json());
app.use(cors({ origin: true }));

app.use("/devices", deviceRoutes);
app.use("/notifications", notificationRoutes);

export const main = functions.https.onRequest(app);

export * from "./events/failure.event";
export * from "./events/notifications.event";
