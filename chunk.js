const { OpenAI } = require("openai");
require("dotenv").config();

const createOverlappingChunks = (gongCallFile, maxLength = 512, overlap = 25) => {
  let chunks = [];
  let chunk = "";
  let charCount = 0;
  let record = {
    transcript: "",
    participants: []
  }

  gongCallFile.monologues.forEach((m) => {
    let transcript = `${m.timestampStr}: ${m.speakerName}: ${m.text}\n`
    record.participants.push(m.speakerName)

    if((charCount + transcript.length) >= maxLength) {
      record.transcript = chunk;
      record.participants = [...new Set(record.participants)]
      chunks.push(record);
      record = {
        transcript: "",
        participants: []
      }
      chunk = "";
      charCount = 0;
    }

    chunk += transcript;
    charCount += transcript.length;
  });

  return chunks;
};

(async () => {
  const openai = new OpenAI({
    apiKey: process.env.OPEN_AI_KEY
  });

  const gongCallFile = require("./gong_data/tempTranscript.json");
  const chunks = createOverlappingChunks(gongCallFile);

  const embeddings = await openai.embeddings.create({
    input: chunks.map((c) => c.transcript),
    model: "text-embedding-3-small"
  });

  chunks.forEach((c, i) => {
    c.embedding = embeddings.data[i].embedding;
  });

  //write to file
  const fs = require("fs");
  fs.writeFileSync("./gong_data/chunks.json", JSON.stringify(chunks));
})();