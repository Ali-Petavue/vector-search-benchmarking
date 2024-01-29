const { OpenAI } = require("openai");
require("dotenv").config();

const createOverlappingChunks = (gongCallFile, maxLength = 512, overlap = 25) => {
  let chunks = [];
  let chunk = "";
  let charCount = 0;
  let participants = [];

  for(let m of gongCallFile.monologues) {
    let transcript = `${m.timestampStr}: ${m.speakerName}: ${m.text}\n`
    participants.push(m.speakerName);

    if((charCount + transcript.length) >= maxLength) {
      chunk += transcript;
      chunks.push({
        transcript: chunk,
        participants: [...new Set(participants)]
      });
      chunk = "";
      participants = [];
      charCount = 0;
    }else{
      //remove else block to get overlapping chunks
      chunk += transcript;
      charCount += transcript.length;
    }
  }

  return chunks;
};

(async () => {
  const openai = new OpenAI({
    apiKey: process.env.OPEN_AI_KEY
  });

  const gongCallFile = require("./gong_data/tempTranscript1.json");
  const chunks = createOverlappingChunks(gongCallFile);

  const embeddings = await openai.embeddings.create({
    input: chunks.map((c) => c.transcript),
    model: "text-embedding-3-small"
  });

  for(let emb of embeddings.data) {
    chunks[emb.index].embedding = emb.embedding;
  }

  //write to file
  const fs = require("fs");
  fs.writeFileSync("./gong_data/chunks-2.json", JSON.stringify(chunks));
})();