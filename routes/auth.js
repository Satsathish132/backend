import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import db from "../db.js";

const router = express.Router();


router.post("/signup", async (req, res) => {

  try {

    const { name, email, password, role } = req.body;

    const [existing] = await db.query(
      "SELECT * FROM users WHERE email=?",
      [email]
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.query(
      "INSERT INTO users (name,email,password,role) VALUES (?,?,?,?)",
      [name, email, hashedPassword, role]
    );

    res.json({ message: "User created successfully" });

  } catch (err) {

    console.log(err);
    res.status(500).json({ message: "Server error" });

  }

});


router.post("/login", async (req, res) => {

  try {

    const { email, password } = req.body;

    const [user] = await db.query(
      "SELECT * FROM users WHERE email=?",
      [email]
    );

    if (user.length === 0) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const valid = await bcrypt.compare(password, user[0].password);

    if (!valid) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign(
      { id: user[0].id },
      "secretkey",
      { expiresIn: "1d" }
    );

    res.json({
      token,
      user: {
        name: user[0].name,
        email: user[0].email,
        role: user[0].role
      }
    });

  } catch (err) {

    console.log(err);
    res.status(500).json({ message: "Server error" });

  }

});

router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    // Check if email credentials are configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.error("Email credentials not configured");
      return res.status(500).json({ message: "Email service not configured" });
    }

    const [user] = await db.query("SELECT * FROM users WHERE email=?", [email]);

    if (user.length === 0) {
      return res.status(400).json({ message: "User not found" });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store OTP in database
    await db.query("UPDATE users SET otp=? WHERE email=?", [otp, email]);

    // Send email
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Password Reset OTP',
      text: `Your OTP for password reset is: ${otp}`
    };

    await transporter.sendMail(mailOptions);

    res.json({ message: "OTP sent to your email" });

  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ message: err?.message || "Unable to send OTP. Please try again later." });
  }
});

router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    const [user] = await db.query("SELECT * FROM users WHERE email=? AND otp=?", [email, otp]);

    if (user.length === 0) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    res.json({ message: "OTP verified" });

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/reset-password", async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await db.query("UPDATE users SET password=?, otp=NULL WHERE email=?", [hashedPassword, email]);

    res.json({ message: "Password reset successfully" });

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;