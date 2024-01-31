const { OpenAI } = require("openai");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

module.exports.createOverlappingChunks = async (
  transcriptFilePath,
  chunkFilePath,
  maxLength = 512,
  overlap = 25
) => {
  const chunkFileExists = fs.existsSync(chunkFilePath);

  if (!chunkFileExists) {
    const file = JSON.parse(fs.readFileSync(transcriptFilePath).toString());

    let chunks = [];
    let chunk = "";
    let charCount = 0;
    let participants = [];

    for (let sentence of file) {
      let transcript = `${sentence.time}: ${sentence.speaker}: ${sentence.text}\n`;
      participants.push(sentence.speaker);

      if (charCount + transcript.length >= maxLength) {
        chunk += transcript;
        chunks.push({
          transcript: chunk,
          participants: [...new Set(participants)],
        });
        chunk = "";
        participants = [];
        charCount = 0;
      } else {
        //remove else block to get overlapping chunks
        chunk += transcript;
        charCount += transcript.length;
      }
    }

    if (chunks.length === 0) return [];

    const openai = new OpenAI({
      apiKey: process.env.OPEN_AI_KEY,
    });

    const embeddings = await openai.embeddings.create({
      input: chunks.map((c) => c.transcript),
      model: "text-embedding-3-small",
    });

    for (let emb of embeddings.data) {
      chunks[emb.index].embedding = emb.embedding;
    }

    fs.writeFileSync(chunkFilePath, JSON.stringify(chunks, undefined, 2), {
      flag: "w",
    });
  }
};
