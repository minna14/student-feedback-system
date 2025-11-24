import React, { useState } from "react";
import { Button, Text, TextInput, View } from "react-native";

const API_BASE = "http://localhost:4000";

export default function Page() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState("");
  const [message, setMessage] = useState("");
  const [result, setResult] = useState("");

  const submitFeedback = async () => {
    if (!name || !email || !category || !message) {
      setResult("Please fill all fields.");
      return;
    }

    setResult("Submitting...");

    try {
      const res = await fetch(`${API_BASE}/api/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, category, message }),
      });

      const data = await res.json();

      if (data.success) {
        setResult(`Thank you! Your Ticket ID: ${data.ticketId}`);
        setName("");
        setEmail("");
        setCategory("");
        setMessage("");
      } else {
        setResult("Error: " + (data.error || "Something went wrong"));
      }
    } catch (err) {
      console.error(err);
      setResult("Server error. Is backend running?");
    }
  };

  return (
    <View style={{ padding: 20, marginTop: 40 }}>
      <Text style={{ fontSize: 22, marginBottom: 10 }}>
        Student Feedback Form
      </Text>

      <TextInput
        placeholder="Name"
        value={name}
        onChangeText={setName}
        style={{ borderWidth: 1, marginBottom: 8, padding: 8 }}
      />
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        style={{ borderWidth: 1, marginBottom: 8, padding: 8 }}
      />
      <TextInput
        placeholder="Category"
        value={category}
        onChangeText={setCategory}
        style={{ borderWidth: 1, marginBottom: 8, padding: 8 }}
      />
      <TextInput
        placeholder="Message"
        value={message}
        onChangeText={setMessage}
        multiline
        style={{ borderWidth: 1, marginBottom: 8, padding: 8, height: 80 }}
      />

      <Button title="Submit Feedback" onPress={submitFeedback} />
      <Text style={{ marginTop: 10 }}>{result}</Text>
    </View>
  );
}
