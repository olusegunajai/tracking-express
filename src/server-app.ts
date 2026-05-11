import express from "express";
import path from "path";
import fs from "fs";
import cors from "cors";
import multer from "multer";
import nodemailer from "nodemailer";
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin
const firebaseConfig = JSON.parse(fs.readFileSync(path.join(process.cwd(), "firebase-applet-config.json"), "utf8"));
if (!getApps().length) {
  initializeApp({
    projectId: firebaseConfig.projectId,
  });
}

const db = getFirestore(firebaseConfig.firestoreDatabaseId || '(default)');

export const app = express();

// Ensure uploads directory exists (safe for serverless)
const uploadsDir = path.join(process.cwd(), "uploads");
try {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
} catch (e) {
  console.warn("Could not create uploads directory (expected in serverless):", e);
}

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

// Multer Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// Email Notification Bridge
app.post("/api/notify/status", async (req, res) => {
  const { tracking_number, status, receiver_email, receiver_name, origin, destination } = req.body;
  
  if (!receiver_email) {
    return res.status(400).json({ error: "Receiver email is required" });
  }

  try {
    // Fetch SMTP settings from Firestore
    const settingsSnap = await db.collection("settings").doc("global").get();
    if (!settingsSnap.exists) {
      console.log("⚠️ Global settings not found in Firestore.");
      return res.status(500).json({ error: "SMTP settings not configured" });
    }

    const config = settingsSnap.data() as any;

    if (!config.smtp_host || !config.smtp_user || !config.smtp_pass) {
      console.log("⚠️ SMTP settings incomplete in Firestore. Skipping email.");
      return res.status(500).json({ error: "SMTP settings incomplete" });
    }

    const transporter = nodemailer.createTransport({
      host: config.smtp_host,
      port: parseInt(config.smtp_port) || 587,
      secure: config.smtp_port === "465",
      auth: {
        user: config.smtp_user,
        pass: config.smtp_pass,
      },
    });

    const mailOptions = {
      from: config.smtp_from || config.smtp_user,
      to: receiver_email,
      subject: `Package Update: ${tracking_number} is ${status}`,
      text: `Hello ${receiver_name || "Valued Customer"},\n\nYour package with tracking number ${tracking_number} is now ${status.toUpperCase()}.\n\nOrigin: ${origin || "Unknown"}\nDestination: ${destination || "Unknown"}\n\nThank you for choosing ${config.site_name || "Tokyo Express"}.`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #1c1917;">Package Status Update</h2>
          <p>Hello <strong>${receiver_name || "Valued Customer"}</strong>,</p>
          <p>Your package with tracking number <span style="font-family: monospace; background: #f5f5f4; padding: 2px 4px; border-radius: 4px;">${tracking_number}</span> is now <strong>${status.toUpperCase()}</strong>.</p>
          <div style="background: #f5f5f4; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; font-size: 14px; color: #78716c;">Origin: ${origin || "Unknown"}</p>
            <p style="margin: 5px 0 0 0; font-size: 14px; color: #78716c;">Destination: ${destination || "Unknown"}</p>
          </div>
          <p>Thank you for choosing <strong>${config.site_name || "Tokyo Express"}</strong>.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`📧 Email sent to ${receiver_email} for package ${tracking_number}`);
    res.json({ message: "Email notification sent" });
  } catch (error) {
    console.error("❌ Failed to send email:", error);
    res.status(500).json({ error: "Failed to send email" });
  }
});

// System Notification Endpoint (Sign Up, Password Reset, etc.)
app.post("/api/notify/system", async (req, res) => {
  const { type, email, details } = req.body;
  
  if (!type || !email) {
    return res.status(400).json({ error: "Type and email are required" });
  }

  try {
    const settingsSnap = await db.collection("settings").doc("global").get();
    const config = settingsSnap.exists ? (settingsSnap.data() as any) : {};
    
    let subject = "";
    let message = "";
    let html = "";

    if (type === "signup") {
      subject = `[${config.site_name || "Tokyo Express"}] Welcome aboard!`;
      message = `Hello ${details?.displayName || "User"},\n\nYour account has been successfully created at ${config.site_name || "Tokyo Express"}. You can now access your dashboard.`;
      html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #1c1917;">Welcome to ${config.site_name || "Tokyo Express"}</h2>
          <p>Hello <strong>${details?.displayName || "User"}</strong>,</p>
          <p>Your account has been successfully created. We are excited to have you with us!</p>
          <p>You can now sign in to your dashboard to manage your activities.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 12px; color: #78716c;">This is an automated notification. Please do not reply directly to this email.</p>
        </div>
      `;
    } else if (type === "password_reset") {
      const resetLink = details?.resetLink || `https://${req.get('host')}/admin/forgot-password`;
      subject = `[${config.site_name || "Tokyo Express"}] Password Reset Request`;
      message = `You requested a password reset for your account at ${config.site_name || "Tokyo Express"}.\n\nPlease follow this link to reset your password: ${resetLink}`;
      html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #1c1917;">Password Reset Request</h2>
          <p>You requested a password reset for your account at <strong>${config.site_name || "Tokyo Express"}</strong>.</p>
          <p>Click the button below to set a new password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" style="background-color: #1c1917; color: #fff; padding: 12px 25px; border-radius: 6px; text-decoration: none; font-weight: bold;">RESET PASSWORD</a>
          </div>
          <p>If you did not request this, you can safely ignore this email.</p>
        </div>
      `;
    }

    // Save to Firestore Notifications collection
    await db.collection("notifications").add({
      type,
      email,
      details,
      subject,
      content: message,
      createdAt: new Date().toISOString(),
      isRead: false
    });

    // Send Email if SMTP is configured
    if (config.smtp_host && config.smtp_user && config.smtp_pass) {
      const transporter = nodemailer.createTransport({
        host: config.smtp_host,
        port: parseInt(config.smtp_port) || 587,
        secure: config.smtp_port === "465",
        auth: {
          user: config.smtp_user,
          pass: config.smtp_pass,
        },
      });

      await transporter.sendMail({
        from: config.smtp_from || config.smtp_user,
        to: email,
        subject,
        text: message,
        html
      });
      console.log(`📧 System Email dispatched: ${type} to ${email}`);
    } else {
      console.log(`ℹ️ SMTP not fully configured. System notification saved to DB only.`);
    }

    res.json({ message: "Notification processed" });
  } catch (error) {
    console.error("❌ System Notification failed:", error);
    res.status(500).json({ error: "Failed to process notification" });
  }
});

// Settings File Upload
app.post("/api/settings/upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }
  const filePath = `/uploads/${req.file.filename}`;
  res.json({ filePath });
});

// Admin Password Reset Endpoint
app.get("/api/settings", async (req, res) => {
  try {
    const settingsSnap = await db.collection("settings").doc("global").get();
    if (settingsSnap.exists) {
      res.json(settingsSnap.data());
    } else {
      res.json({});
    }
  } catch (error) {
    console.error("❌ Failed to fetch settings:", error);
    res.status(500).json({ error: "Failed to fetch settings" });
  }
});

app.post("/api/admin/reset-password", async (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({ error: "Support email is required to trigger reset" });
  }

  try {
    const settingsSnap = await db.collection("settings").doc("global").get();
    if (!settingsSnap.exists) {
      return res.status(500).json({ error: "System settings not found" });
    }

    const config = settingsSnap.data() as any;

    if (!config.smtp_host || !config.smtp_user || !config.smtp_pass) {
      return res.status(500).json({ error: "SMTP/Email settings incomplete in Admin Settings" });
    }

    const transporter = nodemailer.createTransport({
      host: config.smtp_host,
      port: parseInt(config.smtp_port) || 587,
      secure: config.smtp_port === "465",
      auth: {
        user: config.smtp_user,
        pass: config.smtp_pass,
      },
    });

    const resetLink = `https://${req.get('host')}/admin/forgot-password/reset?email=${encodeURIComponent(email)}`;

    const mailOptions = {
      from: config.smtp_from || config.smtp_user,
      to: email,
      subject: `[SECURE] Admin Password Reset Triggered`,
      text: `A password reset was triggered for the Admin account at ${config.site_name || 'Tokyo Express'}.\n\nPlease follow this link to reset your password: ${resetLink}\n\nIf you did not initiate this request, please investigate your system security.`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 2px solid #ef4444; border-radius: 15px;">
          <h2 style="color: #ef4444; margin-top: 0;">Admin Security Alert</h2>
          <p style="color: #444; line-height: 1.6;">A system-wide admin password reset process has been initiated for <strong>${config.site_name || 'Tokyo Express'}</strong>.</p>
          <p style="color: #444; line-height: 1.6;">Click the button below to proceed with resetting your administrator credentials:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" style="background-color: #000; color: #fff; padding: 15px 30px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">RESET ADMIN PASSWORD</a>
          </div>
          <p style="font-size: 12px; color: #999;">Security warning: If you did not request this, please review your admin panel logs immediately.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    // Save to Firestore Notifications
    await db.collection("notifications").add({
      type: "admin_reset",
      email: email,
      subject: mailOptions.subject,
      content: mailOptions.text,
      createdAt: new Date().toISOString(),
      isRead: false
    });

    res.json({ message: "Admin reset link sent successfully" });
  } catch (error) {
    console.error("❌ Reset password failed:", error);
    res.status(500).json({ error: "Failed to process reset request" });
  }
});
