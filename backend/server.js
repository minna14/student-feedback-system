// Load environment variables from .env
require("dotenv").config();
console.log("Loaded N8N_WEBHOOK_URL:", process.env.N8N_WEBHOOK_URL);

const express = require("express");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");
const fetch = require("node-fetch"); // for calling n8n

const app = express();
app.use(cors());
app.use(express.json());

// Creating Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Helper function to generate ticket IDs like FBK-2025-1234
function generateTicketId() {
  const year = new Date().getFullYear();
  const random = Math.floor(1000 + Math.random() * 9000); // 4-digit number
  return `FBK-${year}-${random}`;
}

// Test route to check if backend works
app.get("/", (req, res) => {
  res.send("Backend is running ✅");
});

// Main route: receive feedback, save to DB, trigger n8n
app.post("/api/feedback", async (req, res) => {
  try {
    const { name, email, category, message } = req.body;

    // Simple validation
    if (!name || !email || !category || !message) {
      return res
        .status(400)
        .json({ success: false, error: "All fields are required" });
    }

    const ticketId = generateTicketId();

    // 1) Save to Supabase
    const { error: dbError } = await supabase.from("feedbacks").insert([
      {
        name,
        email,
        category,
        message,
        ticket_id: ticketId,
        status: "Received"
      }
    ]);

    if (dbError) {
      console.error("Supabase error:", dbError);
      return res.status(500).json({ success: false, error: "DB error" });
    }

    // 2) Trigger n8n webhook for automation (emails)
    try {
      await fetch(process.env.N8N_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          category,
          message,
          ticketId
        })
      });
    } catch (n8nErr) {
      console.error("Error calling n8n:", n8nErr);
      // We don't fail the whole request; feedback is already saved
    }

    // 3) Respond to frontend with the ticketId
    return res.json({ success: true, ticketId });
  } catch (err) {
    console.error("Server error:", err);
    return res.status(500).json({ success: false, error: "Server error" });
  }
});

// Optional: get feedback details by ticketId
app.get("/api/feedback/:ticketId", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("feedbacks")
      .select("*")
      .eq("ticket_id", req.params.ticketId)
      .single();

    if (error || !data) {
      return res.status(404).json({ success: false, error: "Not found" });
    }

    res.json({
      success: true,
      ticketId: data.ticket_id,
      status: data.status,
      category: data.category,
      message: data.message,
      createdAt: data.created_at
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

// Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
