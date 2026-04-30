import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import cors from "cors";
import multer from "multer";
import nodemailer from "nodemailer";
import * as admin from 'firebase-admin';

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    // It will use Google Application Default Credentials in the cloud environment
    // or we can try to pass projectId from config if needed.
  });
}

const db = admin.firestore();

const app = express();
const PORT = 3000;

// Initialize Server
async function startServer() {
  // Ensure uploads directory exists
  const uploadsDir = path.join(process.cwd(), "uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
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

  // Settings File Upload
  app.post("/api/settings/upload", upload.single("file"), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    const filePath = `/uploads/${req.file.filename}`;
    res.json({ filePath });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(console.error);
