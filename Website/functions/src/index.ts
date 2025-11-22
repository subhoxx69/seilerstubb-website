import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

// Initialize Firebase Admin
admin.initializeApp();

const db = admin.firestore();
const messaging = admin.messaging();

/**
 * Cloud Function: Send FCM notification when a new reservation is created
 * Triggers on Firestore document creation in reservations collection
 * Sends push notification to all admin devices subscribed to 'new_reservations' topic
 */
export const notifyNewReservation = functions
  .region("europe-west1")
  .firestore.document("reservations/{reservationId}")
  .onCreate(async (snapshot, context) => {
    try {
      const reservation = snapshot.data();
      const reservationId = context.params.reservationId;

      console.log("📧 === NEW RESERVATION CREATED ===");
      console.log(`Reservation ID: ${reservationId}`);
      console.log(`Guest: ${reservation.firstName} ${reservation.lastName}`);
      console.log(`Date: ${reservation.date} at ${reservation.time}`);
      console.log(`People: ${reservation.people}`);

      // Build notification payload
      const notification = {
        title: "🆕 Neue Reservierung!",
        body: `${reservation.firstName} ${reservation.lastName} • ${reservation.date} um ${reservation.time} Uhr • ${reservation.people} ${
          reservation.people === 1 ? "Person" : "Personen"
        }`,
      };

      const data = {
        reservationId: reservationId,
        firstName: reservation.firstName || "",
        lastName: reservation.lastName || "",
        date: reservation.date || "",
        time: reservation.time || "",
        people: String(reservation.people || ""),
        email: reservation.email || "",
        phone: reservation.phone || "",
        notificationType: "new_reservation",
      };

      // Send FCM notification to topic 'new_reservations'
      // This reaches all admin devices subscribed to this topic
      const response = await messaging.send({
        notification: notification,
        data: data,
        topic: "new_reservations",
        android: {
          priority: "high",
          notification: {
            sound: "default",
            channelId: "reservation_channel",
            clickAction: "FLUTTER_NOTIFICATION_CLICK",
          },
        },
        apns: {
          payload: {
            aps: {
              sound: "default",
              alert: {
                title: notification.title,
                body: notification.body,
              },
              badge: 1,
            },
          },
        },
        webpush: {
          notification: {
            title: notification.title,
            body: notification.body,
            icon: "https://seilerstubb.com/icon-192x192.png",
          },
        },
      });

      console.log(
        `✅ Notification sent successfully. Message ID: ${response}`
      );

      // Log to Firestore for audit trail
      await db.collection("notification_logs").add({
        reservationId: reservationId,
        type: "new_reservation",
        title: notification.title,
        body: notification.body,
        messageId: response,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        status: "sent",
      });

      return { success: true, messageId: response };
    } catch (error) {
      console.error("❌ Error sending notification:", error);

      // Log error to Firestore
      await db.collection("notification_logs").add({
        reservationId: context.params.reservationId,
        type: "new_reservation",
        error: String(error),
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        status: "failed",
      });

      throw new functions.https.HttpsError(
        "internal",
        "Failed to send notification"
      );
    }
  });

/**
 * Cloud Function: Send FCM notification when reservation status changes
 * Triggers on Firestore document update in reservations collection
 * Sends status update notification to admin devices
 */
export const notifyReservationStatusChange = functions
  .region("europe-west1")
  .firestore.document("reservations/{reservationId}")
  .onUpdate(async (change, context) => {
    try {
      const beforeData = change.before.data();
      const afterData = change.after.data();
      const reservationId = context.params.reservationId;

      // Check if status changed
      if (beforeData.status === afterData.status) {
        console.log(
          `ℹ️ No status change detected for reservation ${reservationId}`
        );
        return { success: false, message: "No status change" };
      }

      console.log("📧 === RESERVATION STATUS CHANGED ===");
      console.log(`Reservation ID: ${reservationId}`);
      console.log(`Status: ${beforeData.status} → ${afterData.status}`);

      let notificationTitle = "";
      let notificationBody = "";

      if (afterData.status === "confirmed") {
        notificationTitle = "✅ Reservierung bestätigt";
        notificationBody = `${beforeData.firstName} ${beforeData.lastName} - ${beforeData.date} um ${beforeData.time} Uhr`;
      } else if (afterData.status === "rejected") {
        notificationTitle = "❌ Reservierung abgelehnt";
        notificationBody = `${beforeData.firstName} ${beforeData.lastName} - ${beforeData.date} um ${beforeData.time} Uhr`;
      } else if (afterData.status === "completed") {
        notificationTitle = "🎉 Reservierung abgeschlossen";
        notificationBody = `${beforeData.firstName} ${beforeData.lastName} - ${beforeData.date}`;
      }

      if (!notificationTitle) {
        console.log(`ℹ️ Unknown status: ${afterData.status}`);
        return { success: false, message: "Unknown status" };
      }

      // Send FCM notification
      const response = await messaging.send({
        notification: {
          title: notificationTitle,
          body: notificationBody,
        },
        data: {
          reservationId: reservationId,
          status: afterData.status,
          notificationType: "reservation_status_changed",
        },
        topic: "new_reservations",
        android: {
          priority: "high",
          notification: {
            sound: "default",
            channelId: "reservation_channel",
          },
        },
      });

      console.log(`✅ Status notification sent. Message ID: ${response}`);

      // Log to Firestore
      await db.collection("notification_logs").add({
        reservationId: reservationId,
        type: "reservation_status_changed",
        previousStatus: beforeData.status,
        newStatus: afterData.status,
        title: notificationTitle,
        body: notificationBody,
        messageId: response,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        status: "sent",
      });

      return { success: true, messageId: response };
    } catch (error) {
      console.error("❌ Error sending status notification:", error);

      await db.collection("notification_logs").add({
        reservationId: context.params.reservationId,
        type: "reservation_status_changed",
        error: String(error),
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        status: "failed",
      });

      throw new functions.https.HttpsError(
        "internal",
        "Failed to send status notification"
      );
    }
  });

/**
 * HTTP Function: Manually trigger FCM notification (for testing)
 * POST /triggerNotification
 * Body: { reservationId: string, title: string, body: string }
 */
export const triggerNotification = functions
  .region("europe-west1")
  .https.onRequest(async (req, res) => {
    try {
      const { reservationId, title, body } = req.body;

      if (!title || !body) {
        res
          .status(400)
          .json({ error: "Missing required fields: title, body" });
        return;
      }

      console.log("📧 Manual notification trigger:");
      console.log(`Title: ${title}`);
      console.log(`Body: ${body}`);

      const response = await messaging.send({
        notification: { title, body },
        data: {
          reservationId: reservationId || "manual_trigger",
          notificationType: "manual_test",
        },
        topic: "new_reservations",
      });

      res.json({
        success: true,
        message: "Notification sent",
        messageId: response,
      });
    } catch (error) {
      console.error("❌ Error triggering notification:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

/**
 * HTTP Function: Get notification logs
 * GET /notificationLogs?limit=20
 */
export const getNotificationLogs = functions
  .region("europe-west1")
  .https.onRequest(async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;

      const logs = await db
        .collection("notification_logs")
        .orderBy("timestamp", "desc")
        .limit(limit)
        .get();

      const logsData = logs.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      res.json({ success: true, logs: logsData, count: logsData.length });
    } catch (error) {
      console.error("❌ Error fetching logs:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });
