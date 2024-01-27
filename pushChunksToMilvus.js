const file = require("./gong_data/chunks.json");
const { MilvusClient, convertToDataType } = require("@zilliz/milvus2-sdk-node");
require("dotenv").config();

async function main() {
  const milvusClient = new MilvusClient({
    address: process.env.MILVUS_URL,
    username: process.env.MILVUS_USERNAME,
    password: process.env.MILVUS_PASSWORD,
  });

  const mr = await milvusClient.insert({
    collection_name: "recordings",
    fields_data: file.map((block) => ({
      transcript_embeddings: block.embedding,
      transcript: block.transcript,
      metadata: {
        participants: block.participants,
      },
    })),
  });

  console.log(mr);

  process.exit();
}

main();
