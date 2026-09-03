
// HAMOU MATH GLOBAL V18.2
// Google OAuth - Start authentication

import { google } from "googleapis";

export default async function handler(req, res) {
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
      return res.status(500).json({
        success: false,
        error: "Google OAuth غير مهيأ في Vercel."
      });
    }

    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUri
    );

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      scope: [
        "https://www.googleapis.com/auth/drive.readonly"
      ]
    });

    return res.redirect(302, authUrl);

  } catch (error) {

    console.error("Google OAuth error:", error);

    return res.status(500).json({
      success: false,
      error: "تعذر بدء تسجيل الدخول إلى Google."
    });
  }
}
