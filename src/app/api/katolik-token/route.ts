import { NextResponse } from "next/server";
import admin from "firebase-admin";

function initAdmin() {
  if (admin.apps.length > 0) return;
  const sa = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!sa) throw new Error("FIREBASE_SERVICE_ACCOUNT env is missing");
  const cred = JSON.parse(sa) as Parameters<typeof admin.credential.cert>[0];
  admin.initializeApp({
    credential: admin.credential.cert(cred),
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  });
}

export async function POST() {
  try {
    initAdmin();
    const uid = "katolik-public";
    const token = await admin.auth().createCustomToken(uid);
    return NextResponse.json({ token });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
