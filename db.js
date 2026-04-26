import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const mysql = require("mysql2");

const connection = mysql.createConnection({
  host: process.env.MYSQLHOST,      // mysql.railway.internal
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE,
  port: process.env.MYSQLPORT
});

connection.connect((err) => {
  if (err) {
    console.error("DB ERROR:", err);  // Don't crash
  } else {
    console.log("DB Connected ✅");
  }
});

const ensureOtpColumn = async () => {
  try {
    const [rows] = await db.query(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' AND COLUMN_NAME = 'otp'",
      [process.env.DB_NAME || "pathlytics"]
    );

    if (rows.length === 0) {
      await db.query("ALTER TABLE users ADD COLUMN otp VARCHAR(10)");
      console.log("Added missing otp column to users table.");
    }
  } catch (error) {
    console.error("Database schema check failed:", error);
  }
};

ensureOtpColumn();

export default db;