import express from "express";

const app = express();
const port = 3000;

function extractUsername(req, res, next) {
  const username = req.headers["x-username"];
  req.username = username || null;
  next();
}

function parseJsonArray(req, res, next) {
  const chunks = [];
  req.on("data", (chunk) => chunks.push(chunk));
  req.on("end", () => {
    const bodyString = Buffer.concat(chunks).toString();
    let body;
    try {
      body = JSON.parse(bodyString);
    } catch (error) {
      res.status(400).send("Expected body to be valid JSON.");
      return;
    }

    if (!Array.isArray(body)) {
      res.status(400).send("Expected body to be a JSON array.");
      return;
    }

    for (const item of body) {
      if (typeof item !== "string") {
        res.status(400).send("Expected all elements in array to be strings.");
        return;
      }
    }

    req.body = body;
    next();
  });
}

app.use(extractUsername);
app.use(parseJsonArray);

app.post("/", (req, res) => {
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