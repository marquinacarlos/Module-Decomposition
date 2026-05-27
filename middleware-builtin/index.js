import express from "express";

const app = express();
const port = 3000;

function extractUsername(req, res, next) {
  const username = req.headers["x-username"];
  req.username = username || null;
  next();
}

app.use(extractUsername);
app.use(express.json());

app.post("/", (req, res) => {
  if (!Array.isArray(req.body)) {
    res.status(400).send("Expected body to be a JSON array.");
    return;
  }

  for (const item of req.body) {
    if (typeof item !== "string") {
      res.status(400).send("Expected all elements in array to be strings.");
      return;
    }
  }

  const authLine = req.username
    ? `You are authenticated as ${req.username}.`
    : "You are not authenticated.";

  const subjects = req.body;
  const count = subjects.length;
  let subjectLine;

  if (count === 0) {
    subjectLine = `You have requested information about 0 subjects.`;
  } else {
    subjectLine = `You have requested information about ${count} subject${count > 1 ? "s" : ""}: ${subjects.join(", ")}.`;
  }

  res.send(`${authLine}\n\n${subjectLine}\n`);
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});