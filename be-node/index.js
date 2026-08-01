const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
require("dotenv").config();

const { sendEmailHandler } = require("./controllers/email");
const { createPaymentHandler, paymentWebhookHandler } = require("./controllers/payment");

const app = express();
const port = process.env.PORT || 3000;

// Enable CORS
app.use(cors());

// Webhook endpoint needs raw body if using HMAC, but we'll use JSON for the simpler X-Webhook-Token verification.
app.use(bodyParser.json());

// --- Health Check ---
app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "oziktag-node-backend" });
});

// --- Email Routes ---
app.post("/api/email/send", sendEmailHandler);

// --- Payment Routes ---
app.post("/api/payment/create", createPaymentHandler);
app.post("/api/payment/webhook", paymentWebhookHandler);

app.listen(port, () => {
  console.log(`Node backend running on port ${port}`);
});
