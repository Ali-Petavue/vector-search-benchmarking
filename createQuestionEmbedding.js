const { default: OpenAI } = require("openai");
require("dotenv").config();

async function main() {
  const openai = new OpenAI({
    apiKey: process.env.OPEN_AI_KEY,
  });

  const questions = [
    "what is prasanna saying",
    "what samuel is trying to understand",
    "what is the product strategy",
    "what are deliverables for the next quarter",
    "what are the next steps",
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
