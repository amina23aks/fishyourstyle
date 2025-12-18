import admin from "firebase-admin";

let app: admin.app.App | null = null;

function getFirebaseAdminApp(): admin.app.App {
  if (app) return app;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !rawPrivateKey) {
    throw new Error(
      "Missing Firebase admin credentials. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY.",
    );
  }

  const privateKey = rawPrivateKey.replace(/\\n/g, "\n");

  app = admin.apps.length
    ? admin.app()
    : admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });

  return app;
}

export function getFirebaseAdminAuth(): admin.auth.Auth {
  return getFirebaseAdminApp().auth();
}
