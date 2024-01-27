const { default: OpenAI } = require("openai");
require("dotenv").config();

async function main() {
  const openai = new OpenAI({
    apiKey: process.env.OPEN_AI_KEY,
  });

  const questions = [
    "How many people have blocker",
    "was salesforce discussed",
    "Are there any extreme issue",
    "what are the issues",
    "was chart issue discussed",
    "Is there a blocker for google sheet integration",
    "what chart library is decided to be used.",
    "what are the blocker for Ali",
    "what are the things jeyaraj is going to work on",
    "who all need a followup call to resolve issues",
  ];

  const data = [];

  const res = await openai.embeddings.create({
    input: questions,
    model: "text-embedding-3-small",
  });

  res.data.forEach((d) => {
    data.push({
      question: questions[d.index],
      embedding: d.embedding,
    });
  });

  const fs = require("fs");
  fs.writeFileSync("./gong_data/questions.json", JSON.stringify(data));
}

main();
