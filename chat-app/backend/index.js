import express from "express";
import cors from "cors";

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const messages = [];
const waitingClients = [];
let version = 0;

app.get("/messages", (req, res) => {
  const since = req.query.since;
  const longpoll = req.query.longpoll === "true";

  if (!since) {
    return res.json({ version, messages });
  }

  const sinceVersion = Number(since);

  if (version > sinceVersion) {
    return res.json({ version, messages });
  }

  if (longpoll) {
    waitingClients.push(() => res.json({ version, messages }));
  } else {
    res.json({ version, messages });
  }
});

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
    likes: 0,
    dislikes: 0,
  };

  messages.push(message);
  version++;

  while (waitingClients.length > 0) {
    const callback = waitingClients.pop();
    callback();
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

  version++;

  while (waitingClients.length > 0) {
    const callback = waitingClients.pop();
    callback();
  }

  res.json(messages[id]);
});

app.listen(port, () => {
  console.log(`Chat server running on port ${port}`);
});