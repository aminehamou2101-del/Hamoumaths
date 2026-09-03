// HAMOU MATH GLOBAL V18.2
// Google OAuth - Start authentication

import { google } from "googleapis";

export function GET() {
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;

    // التحقق من إعدادات Vercel
    if (!clientId || !clientSecret || !redirectUri) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Google OAuth غير مهيأ بشكل صحيح في Vercel.",
          missing: {
            GOOGLE_CLIENT_ID: !clientId,
            GOOGLE_CLIENT_SECRET: !clientSecret,
            GOOGLE_REDIRECT_URI: !redirectUri
          }
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json; charset=utf-8"
          }
        }
      );
    }

    // إنشاء عميل Google OAuth
    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUri
    );

    // إنشاء رابط المصادقة
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      scope: [
        "https://www.googleapis.com/auth/drive.readonly"
      ]
    });

    // تحويل المستخدم إلى Google
    return Response.redirect(authUrl, 302);

  } catch (error) {
    console.error("HAMOU MATH Google OAuth Error:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: "تعذر بدء المصادقة مع Google.",
        message: error?.message || "Unknown error"
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json; charset=utf-8"
        }
      }
    );
  }
}
