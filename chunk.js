const file = require("./gong_data/tempTranscript.json");
const { chunk } = require("llm-chunk");
const { OpenAI } = require("openai");

async function main() {
  let meta = {
    speakers: [],
    timeStamp: 0
  };
  
  let lastStr = "";
  let lastCharCount = 0;

  let str = ""
  let charCount = 0;

  file.monologues.forEach((m => {
    if ((charCount + m.text.length) > 512) {
      str = ""
    }
  })


  // const res = chunk(text, {
  //   maxLength: 512,
  //   overlap: 50,
  //   splitter: "sentence",
  //   delimiters: "\n",
  // });

  // console.log(res);

  // const openai = new OpenAI({
  //   apiKey: "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",
  //   organization: "org-WnytsNc0haHpbIXtP7H4a44X",
  // });

  // const embeddingRes = await openai.embeddings.create({
  //   input: res,
  //   model: "text-embedding-3-small",
  // });

  // console.dir(embeddingRes, { depth: null });
}

main();
