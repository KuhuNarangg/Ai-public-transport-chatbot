// 🔐 Gemini API Key
const apiKey = "AIzaSyCdFQdqfBur9MFz1Rjzhj0HYJ9abepibfk";

// 💬 Conversation history for context
let conversationHistory = [];
let savedRoutes = [];

// 📤 Send user message to Gemini and handle response
async function sendMessage() {
  const input = document.getElementById("user-input");
  const chatBox = document.getElementById("chat-box");
  const userMessage = input.value.trim();

  if (!userMessage) return;

  // Display user message
  chatBox.innerHTML += `<div class="user"><strong>You:</strong> ${userMessage}</div>`;
  input.value = "";
  chatBox.scrollTop = chatBox.scrollHeight;

  // Add to conversation history
  conversationHistory.push({ role: "user", content: userMessage });
  addToRecent(userMessage);

  // 🌐 Gemini API call
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  try {
    // Construct conversation context
    let conversationContext = conversationHistory.map(msg => `${msg.role === "user" ? "You" : "AI"}: ${msg.content}`).join("\n");

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `You are a smart Indian public transit assistant. For the query: "${userMessage}", provide:
- Travel modes (bus, train, metro)
- Specific names (e.g., Shatabdi Express, Blue Line)
- Departure times or durations
- End clearly with a "Recommended Route"
Follow conversation history and respond accordingly:
${conversationContext}`
          }]
        }]
      })
    });

    const data = await response.json();
    let botReply = data.candidates?.[0]?.content?.parts?.[0]?.text || "❌ Sorry, I couldn't get a response.";

    // Format Markdown to HTML
    botReply = botReply.replace(/\*\*(.*?)\*\*/g, "<b>$1</b>").replace(/\*(.*?)\*/g, "<i>$1</i>");

    // Split reply for display
    const replyChunks = botReply.split(/\n\n|(?=- )|(?=Recommended Route:)/).filter(c => c.trim());
    let trainReply = "";
    let busReply = "";
    let otherReply = "";

    replyChunks.forEach(chunk => {
      const lower = chunk.toLowerCase();
      const formatted = `<p style="color: black;">${chunk}</p>`;
      if (lower.includes("train")) {
        trainReply += formatted;
      } else if (lower.includes("bus")) {
        busReply += formatted;
      } else {
        otherReply += formatted;
      }
    });

    if (trainReply) await typeBotMessage(`<div class="bot train-info"><strong>🚆 Train Info:</strong>${trainReply}<button class="star-btn" onclick="saveRoute(\`${trainReply}\`)">⭐</button></div>`);
    if (busReply) await typeBotMessage(`<div class="bot bus-info"><strong>🚌 Bus Info:</strong>${busReply}<button class="star-btn" onclick="saveRoute(\`${busReply}\`)">⭐</button></div>`);
    if (otherReply) await typeBotMessage(`<div class="bot"><strong>🧠 AI:</strong>${otherReply}<button class="star-btn" onclick="saveRoute(\`${otherReply}\`)">⭐</button></div>`);

    chatBox.scrollTop = chatBox.scrollHeight;
    conversationHistory.push({ role: "ai", content: botReply });

  } catch (error) {
    chatBox.innerHTML += `<div class="bot"><strong>AI:</strong> ❌ Error connecting to AI.</div>`;
    console.error("Gemini API Error:", error);
  }
}

// ✨ Typing Effect
async function typeBotMessage(html) {
  const chatBox = document.getElementById("chat-box");
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = html;
  const finalElement = tempDiv.firstChild;

  const children = Array.from(finalElement.querySelectorAll("p"));
  finalElement.innerHTML = ""; // Clear for typing

  chatBox.appendChild(finalElement);
  chatBox.scrollTop = chatBox.scrollHeight;

  for (const child of children) {
    const p = document.createElement("p");
    p.style.color = "black";
    finalElement.appendChild(p);

    for (let i = 0; i < child.innerText.length; i++) {
      p.innerHTML += child.innerText.charAt(i);
      await new Promise(res => setTimeout(res, 1)); // fast typing
    }
  }

  // Add ⭐ button after typing
  const starBtn = document.createElement("button");
  starBtn.className = "star-btn";
  starBtn.innerHTML = "⭐";
  starBtn.onclick = () => saveRoute(finalElement.innerHTML);
  finalElement.appendChild(starBtn);
}

// ⭐ Save Route
function saveRoute(content) {
  if (!savedRoutes.includes(content)) {
    savedRoutes.push(content);
    updateSavedList();
  }
}

// 🧾 Update Saved List UI
function updateSavedList() {
  const list = document.getElementById("saved-list");
  list.innerHTML = "";
  savedRoutes.forEach((item, index) => {
    const li = document.createElement("li");
    li.innerHTML = `⭐ Route ${index + 1}`;
    li.onclick = () => {
      document.getElementById("chat-box").innerHTML += `<div class="bot">${item}</div>`;
    };
    list.appendChild(li);
  });
}

// 🕘 Add to Recent Searches
function addToRecent(query) {
  const historyList = document.getElementById("history-list");
  const li = document.createElement("li");
  li.textContent = query;
  li.onclick = () => {
    document.getElementById("user-input").value = query;
    sendMessage();
  };
  historyList.appendChild(li);
}

// 🎬 Start chat screen
function startChat() {
  document.getElementById("home-screen").style.display = "none";
  document.getElementById("chatbot-screen").style.display = "flex";
  document.getElementById("user-input").focus();
}

// ⌨️ Enable Enter to send
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("user-input").addEventListener("keypress", function (event) {
    if (event.key === "Enter") {
      event.preventDefault();
      sendMessage();
    }
  });
});

// 🔁 Reset chat
function resetChat() {
  document.getElementById("chat-box").innerHTML = "";
  conversationHistory = [];
}

// 🎤 Voice input
function startVoiceInput() {
  const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.lang = 'en-IN';
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.start();

  recognition.onstart = () => {
    document.getElementById("mic-btn").innerText = "🎙️ Listening...";
  };

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    document.getElementById("user-input").value = transcript;
    sendMessage();
  };

  recognition.onerror = (event) => {
    alert("🎤 Voice input error: " + event.error);
  };

  recognition.onend = () => {
    document.getElementById("mic-btn").innerText = "🎤";
  };
}

// 🔄 Toggle suggestions popup
function toggleSuggestions() {
  const popup = document.getElementById("suggestions-popup");
  popup.style.display = popup.style.display === "none" ? "block" : "none";
}

// 📌 Suggestion button click
function suggestQuestion(question) {
  document.getElementById("user-input").value = question;
  toggleSuggestions();
  sendMessage();
}
