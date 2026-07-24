require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const nodemailer = require("nodemailer");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
// Allow requests from Next.js frontend (default 3000, or via env variable)
app.use(cors()); // Allow all origins to prevent CORS issues after deployment
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, { dbName: "portfolio" })
  .then(() => console.log("Connected to MongoDB successfully (Database: portfolio)"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Mongoose Schema & Model
const contactSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  subject: { type: String, required: true },
  message: { type: String, required: true },
}, { timestamps: true }); // Automatically adds createdAt and updatedAt

const Contact = mongoose.model("Contact", contactSchema);

// Email Transporter Configuration
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// API Routes
app.post("/api/contact", async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    
    // Basic validation
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ success: false, error: "All fields are required" });
    }

    const newContact = new Contact({ name, email, subject, message });
    await newContact.save();

    // Setup email notification
    const mailOptions = {
      from: `"${name}" <${process.env.EMAIL_USER}>`, // Sent from your authenticated email
      to: process.env.EMAIL_USER,                    // Sent TO your email
      replyTo: email,                                // When you hit 'reply' it replies to the visitor
      subject: `Portfolio Contact: ${subject}`,
      text: `You have received a new message from your portfolio website.\n\nName: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
    };

    // Send the email (doesn't block the response)
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error sending email notification:", error);
      } else {
        console.log("Email notification sent:", info.response);
      }
    });

    res.status(201).json({ success: true });
  } catch (error) {
    console.error("Error saving contact:", error);
    res.status(500).json({ success: false, error: "Failed to save contact" });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
