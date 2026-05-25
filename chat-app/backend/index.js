import express from "express";
import cors from "cors";

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const messages = [];
const waitingClients = [];

// GET — support polling and long-polling using: ?since= and ?longpoll=true
app.get("/messages", (req, res) => {
  const since = req.query.since;
  const longpoll = req.query.longpoll === "true";

  let messagesToSend;

  if (since) {
    const sinceTime = Number(since);
    messagesToSend = messages.filter(
      (m) => m.timestamp > sinceTime || (m.updatedAt && m.updatedAt > sinceTime)
    );
  } else {
    messagesToSend = [...messages];
  }

  if (longpoll && messagesToSend.length === 0) {
    waitingClients.push((msg) => res.json(msg));
  } else {
    res.json(messagesToSend);
  }
});

// POST — send message
app.post("/messages", (req, res) => {
  const { user, text } = req.body;

  if (!user || !text || user.trim() === "" || text.trim() === "") {
    return res.status(400).json({ error: "User and text are required." });
  }

  const message = {
		id: messages.length,
		user: user.trim(),
		text: text.trim(),
		timestamp: Date.now(),
		updatedAt: null,
		likes: 0,
		dislikes: 0,
	};

  messages.push(message);

  // Notify client using long polling
  while (waitingClients.length > 0) {
    const callback = waitingClients.pop();
    callback([message]);
  }

  res.json(message);
});

app.post("/messages/:id/react", (req, res) => {
  const id = Number(req.params.id);
  const { reaction } = req.body;

  if (id < 0 || id >= messages.length) {
    return res.status(404).json({ error: "Message not found." });
  }

  if (reaction !== "like" && reaction !== "dislike") {
    return res.status(400).json({ error: "Reaction must be 'like' or 'dislike'." });
  }

  if (reaction === "like") {
    messages[id].likes++;
  } else {
    messages[id].dislikes++;
  }

  messages[id].updatedAt = Date.now();

  // Notify clients in long-polling
  while (waitingClients.length > 0) {
    const callback = waitingClients.pop();
    callback([messages[id]]);
  }

  res.json(messages[id]);
});

app.listen(port, () => {
  console.log(`Chat server running on port ${port}`);
});