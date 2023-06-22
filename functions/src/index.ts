/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import {onRequest} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

admin.initializeApp();
const firestore = admin.firestore();

export const helloWorld = onRequest((request, response) => {
  logger.info("Hello logs!!", {structuredData: true});
  response.send("Hello from Firebase!!");
});

export const sendNoti = functions.https.onCall(async (data, context) => {
  try {
    const {email} = data;
    const userDocRef = admin.firestore().collection("user").doc(email);
    const userDocSnapshot = await userDocRef.get();

    if (!userDocSnapshot.exists) {
      throw new Error("User document not found");
    }

    const userData = userDocSnapshot.data();
    if (!userData) {
      throw new Error("User data not available");
    }
    const partnerEmail = userData.partnerEmail;

    const partnerDocRef = firestore.collection("user").doc(partnerEmail);
    const partnerDocSnapshot = await partnerDocRef.get();

    if (!partnerDocSnapshot.exists) {
      throw new Error("Partner document not found");
    }

    const partnerData = partnerDocSnapshot.data();
    if (!partnerData) {
      throw new Error("Partner data not available");
    }
    const pushToken = partnerData.pushToken;
    const message = {
      token: pushToken,
      notification: {
        title: "알림",
        body: "새로운 할일이 생겼습니다.",
      },
    };

    await admin.messaging().send(message);

    return {success: true, message: "Notification sent"};
  } catch (error) {
    console.error("Error sending notification:", error);
    throw new functions.https.HttpsError("internal", "Error sending");
  }
});
