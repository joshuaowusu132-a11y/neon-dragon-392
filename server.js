
const express = require("express");
const { GoogleGenAI } = require("@google/genai");

const app = express();
app.use(express.json({ limit: "10kb" }));

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    console.error("ERROR: GEMINI_API_KEY is missing.");
    process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });

app.get("/", (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>D & E Studios AI Assistant</title>
<style>
body {
    font-family: Arial, sans-serif;
    background: #eef2f7;
    margin: 0;
    padding: 25px 12px;
}
.chat {
    max-width: 520px;
    margin: auto;
    padding: 20px;
    background: white;
    border-radius: 16px;
    box-shadow: 0 4px 18px #0001;
}
h2 { text-align: center; color: #1746a2; }
#messages {
    height: 350px;
    overflow-y: auto;
    border: 1px solid #ddd;
    border-radius: 10px;
    padding: 12px;
    margin-bottom: 14px;
}
.message {
    padding: 11px;
    border-radius: 10px;
    margin: 8px 0;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
}
.user { background: #dbeafe; text-align: right; }
.bot { background: #f1f5f9; }
form { display: flex; gap: 8px; }
input {
    flex: 1;
    min-width: 0;
    padding: 12px;
    border: 1px solid #ccc;
    border-radius: 8px;
}
button {
    padding: 12px 16px;
    background: #1746a2;
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
}
button:disabled { opacity: 0.6; }
</style>
</head>
<body>
<div class="chat">
    <h2>D & E Studios AI Assistant</h2>
    <div id="messages" aria-live="polite">
        <div class="message bot">
            Hello! Welcome to D & E Studios.
            I'm your AI assistant. What would you like to learn today?
        </div>
    </div>
    <form id="chatForm">
        <input id="message" maxlength="2000"
            placeholder="Ask me anything..." required>
        <button id="send" type="submit">Send</button>
    </form>
</div>

<script>
const form = document.getElementById("chatForm");
const input = document.getElementById("message");
const messages = document.getElementById("messages");
const send = document.getElementById("send");

function addMessage(text, type) {
    const div = document.createElement("div");
    div.className = "message " + type;
    div.textContent = text;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
}

form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const message = input.value.trim();
    if (!message || send.disabled) return;

    addMessage(message, "user");
    input.value = "";
    send.disabled = true;
    send.textContent = "Thinking...";

    try {
        const response = await fetch("/message", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.reply || "Request failed");
        }

        addMessage(data.reply, "bot");
    } catch (error) {
        addMessage(
            error.message || "Sorry, I couldn't answer. Please try again.",
            "bot"
        );
    } finally {
        send.disabled = false;
        send.textContent = "Send";
        input.focus();
    }
});
</script>
</body>
</html>
    `);
});

app.post("/message", async (req, res) => {
    const message = req.body?.message;

    if (typeof message !== "string" || !message.trim()) {
        return res.status(400).json({
            reply: "Please type a question."
        });
    }

    if (message.length > 2000) {
        return res.status(400).json({
            reply: "Please keep your message under 2000 characters."
        });
    }

    try {
        
        
let response;

for (let attempt = 1; attempt <= 3; attempt++) {
  try {
    response = await ai.models.generateContent({
      model: "gemini-3.5-flash-lite",
      contents: message.trim(),
      config: {
        systemInstruction:
          "You are the friendly D & E Studios AI Assistant. " +
          "Teach technology, website development, programming, " +
          "computer skills, and everyday topics in simple steps. " +
          "Be honest when you are unsure."
      }
    });

    break;
  } catch (error) {
    console.error(`Gemini attempt ${attempt} failed:`, error.message);

    if (attempt === 3) {
      throw error;
    }

    await new Promise(resolve => setTimeout(resolve, attempt * 2000));
  }
}

const reply = response.text;


        if (!reply) {
            return res.status(502).json({
                reply: "I couldn't generate an answer. Please try again."
            });
        }

        console.log("AI answered a message.");
        res.json({ status: "success", reply });

    } catch (error) {
        console.error("Gemini request failed:", error.message);

        res.status(500).json({
            reply: "I couldn't contact the AI service. Check your API key, model access, internet connection, and usage limits, then try again."
        });
    }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`D & E Studios AI bot running on port ${PORT}`);
});
