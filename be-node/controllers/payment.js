const axios = require("axios");

async function createPaymentHandler(req, res) {
  const {
    order_id,
    amount,
    currency = "IDR",
    expires_in_hours = 24,
    success_return_url,
    cancel_return_url,
    payment_method_type_code = "qris",
  } = req.body;

  const { SUMOPOD_API_KEY, APP_URL } = process.env;

  if (!SUMOPOD_API_KEY) {
    console.error("[Payment] SumoPod API key not configured");
    return res.status(500).json({ error: "SumoPod API key not configured" });
  }

  try {
    const response = await axios.post(
      "https://api-pay.sumopod.com/api/v1/payments",
      {
        order_id,
        amount,
        currency,
        expires_in_hours,
        success_return_url,
        cancel_return_url,
        payment_method_type_code,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": SUMOPOD_API_KEY,
        },
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error("[Payment] Failed to create payment:", error.response?.data || error.message);
    res.status(500).json({ 
      error: "Failed to create payment in SumoPod",
      details: error.response?.data || error.message 
    });
  }
}

async function paymentWebhookHandler(req, res) {
  const { WEBHOOK_TOKEN, PYTHON_BACKEND_URL } = process.env;
  
  // Verify token
  const expected = WEBHOOK_TOKEN;
  const received = req.headers["x-webhook-token"];

  if (expected !== received) {
    console.warn("[Webhook] Invalid token received");
    return res.status(401).send("Invalid webhook token");
  }

  const event = req.body;
  console.log(`[Webhook] Verified webhook: ${event.event_type} for order ${event.data?.order_id}`);

  // Forward the verified event to the Python backend so it can update the database
  try {
    const backendUrl = PYTHON_BACKEND_URL || "http://localhost:8000";
    await axios.post(`${backendUrl}/api/topup/webhook-internal`, event);
    res.sendStatus(200);
  } catch (error) {
    console.error("[Webhook] Failed to forward to Python backend:", error.message);
    // Still return 200 to SumoPod so it doesn't retry infinitely if our Python backend is temporarily down.
    // Or return 500 if we want SumoPod to retry. Let's return 500 so SumoPod retries.
    res.status(500).send("Failed to process webhook internally");
  }
}

module.exports = {
  createPaymentHandler,
  paymentWebhookHandler,
};
