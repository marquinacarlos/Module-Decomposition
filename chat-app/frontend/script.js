// Change this to your deployed backend URL when you deploy
const API_URL = "http://localhost:3000";

const messagesDiv = document.getElementById("messages");
const inputUser = document.getElementById("input-user");
const inputText = document.getElementById("input-text");
const sendBtn = document.getElementById("send-btn");
const status = document.getElementById("status");

const state = { messages: [] };

function formatTime(timestamp) {
  return new Date(timestamp).toLocaleTimeString();
}

function render() {
  messagesDiv.innerHTML = "";
  for (const msg of state.messages) {
    const div = document.createElement("div");
    div.className = "message";
    div.innerHTML = `
      <div class="message-header">
        <span class="message-user">${msg.user}</span>
        <span class="message-time">${formatTime(msg.timestamp)}</span>
      </div>
      <div class="message-text">${msg.text}</div>
      <div class="message-reactions">
        <button onclick="react(${msg.id}, 'like')">👍 ${msg.likes}</button>
        <button onclick="react(${msg.id}, 'dislike')">👎 ${msg.dislikes}</button>
      </div>
    `;
    messagesDiv.appendChild(div);
  }
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// Polling — pregunta cada 100ms por mensajes nuevos
const keepFetchingMessages = async () => {
  try {
    const lastTime =
      state.messages.length > 0
        ? state.messages[state.messages.length - 1].timestamp
        : null;
    const query = lastTime ? `?since=${lastTime}` : "";
    const response = await fetch(`${API_URL}/messages${query}`);
    const newMessages = await response.json();
    if (newMessages.length > 0) {
      state.messages.push(...newMessages);
      render();
    }
  } catch (error) {
    console.error("Error fetching messages:", error);
  }
  setTimeout(keepFetchingMessages, 100);
};

async function sendMessage() {
  const user = inputUser.value.trim();
  const text = inputText.value.trim();

  if (!user || !text) {
    status.textContent = "Please enter both name and message.";
    return;
  }

  try {
    const response = await fetch(`${API_URL}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user, text }),
    });

    if (!response.ok) {
      const error = await response.json();
      status.textContent = error.error || "Error sending message.";
      return;
    }

    inputText.value = "";
    status.textContent = "";
  } catch (error) {
    status.textContent = "Could not connect to server.";
  }
}

async function react(id, reaction) {
  try {
    const response = await fetch(`${API_URL}/messages/${id}/react`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reaction }),
    });

    if (response.ok) {
      const updated = await response.json();
      const msg = state.messages.find((m) => m.id === id);
      if (msg) {
        msg.likes = updated.likes;
        msg.dislikes = updated.dislikes;
        render();
      }
    }
  } catch (error) {
    console.error("Error reacting:", error);
  }
}

sendBtn.addEventListener("click", sendMessage);
inputText.addEventListener("keydown", (e) => {
  if (e.key === "Enter") sendMessage();
});

keepFetchingMessages();