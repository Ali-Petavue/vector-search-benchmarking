const fs = require("fs");
const path = require("path");
const { default: OpenAI } = require("openai");
const { MilvusClient } = require("@zilliz/milvus2-sdk-node");
const { QdrantClient } = require("@qdrant/js-client-rest");
const mysql = require("mysql");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;

const { createOverlappingChunks } = require("./chunk");
const { embedQuestion } = require("./embed-question");

const { insertChunksToMilvus } = require("./milvus-insert");
const { searchMilvus } = require("./milvus-search");

const { insertChunksToQdrant } = require("./qdrant-insert");
const { searchQdrant } = require("./qdrant-search");

const { insertChunksToSinglestore } = require("./singlestore-insert");
const { searchSinglestore } = require("./singlestore-search");
const { getCallsFromGong } = require("./gong");

require("dotenv").config();

const SHOULD_GET_RECORDS = false;
const SHOULD_PUSH_CHUNKS = true;
const SHOULD_EMBED_QUESTION = false;
const CHUNK_LENGTH = 512;
const CHUNK_OVERLAP = 25;

async function main() {
  const openai = new OpenAI({
    apiKey: process.env.OPEN_AI_KEY,
  });

  const milvusClient = new MilvusClient({
    address: process.env.MILVUS_URL,
    username: process.env.MILVUS_USERNAME,
    password: process.env.MILVUS_PASSWORD,
  });

  const qdrantClient = new QdrantClient({
    url: "https://21804344-75d7-4686-b893-cfb19b512b05.us-east4-0.gcp.cloud.qdrant.io",
    apiKey: "HjbMg75cpZq2VH_lCL8JU193_i8cjOSCGSu1ed6UCRHwZupDEqz7Kw",
  });

  const singleStoreConnection = mysql.createConnection({
    host: "svc-3482219c-a389-4079-b18b-d50662524e8a-shared-dml.aws-virginia-6.svc.singlestore.com",
    port: 3333,
    user: "ali-play",
    password: "8EjXdnRUQifcPqURvfL3DxJVFosLpLkx",
    database: "database_06865",
    ssl: {
      rejectUnauthorized: false,
    },
  });

  if (SHOULD_GET_RECORDS) {
    await getCallsFromGong();
  }

  try {
    const files = fs.readdirSync(path.join(__dirname, "./data/raw"));

    if (SHOULD_PUSH_CHUNKS) {
      console.time("chunking");

      for (const file of files) {
        const rawFilePath = path.join(__dirname, "./data/raw", file);
        const chunkFilePath = path.join(__dirname, "./data/chunk", file);

        await createOverlappingChunks(
          rawFilePath,
          chunkFilePath,
          CHUNK_LENGTH,
          CHUNK_OVERLAP
        );

        console.timeLog("chunking");
      }

      console.timeEnd("chunking");

      console.info("inserting chunks");
      const times = await Promise.all([
        insertChunksToMilvus(milvusClient),
        // insertChunksToQdrant(qdrantClient),
        insertChunksToSinglestore(singleStoreConnection),
      ]);

      console.log("chunks inserted", times);
    }

    const questionsPath = path.join(__dirname, "./data/questions.json");
    const questionEmbeddingPath = path.join(
      __dirname,
      "./data/question_embedding.json"
    );

    if (!fs.existsSync(questionEmbeddingPath)) {
      fs.writeFileSync(questionEmbeddingPath, JSON.stringify({}), {
        flag: "w",
      });
    }

    const questionEmbedding = JSON.parse(
      fs.readFileSync(questionEmbeddingPath).toString()
    );

    if (SHOULD_EMBED_QUESTION) {
      let questions = JSON.parse(fs.readFileSync(questionsPath).toString());

      questions = questions.filter((question) => !questionEmbedding[question]);

      if (questions.length > 0) {
        console.time("question_embed");

        const embeds = await embedQuestion(openai, questions);

        for (let idx = 0; idx < questions.length; idx++) {
          const question = questions[idx];

          questionEmbedding[question] = {
            embeddings: embeds.data[idx].embedding,
          };
        }

        fs.writeFileSync(
          path.join(__dirname, "./data/question_embedding.json"),
          JSON.stringify(questionEmbedding, undefined, 2)
        );

        console.timeEnd("question_embed");
      }
    }

    console.time("search");
    const outputs = await Promise.all([
      searchMilvus(milvusClient, questionEmbedding),
      searchQdrant(qdrantClient, questionEmbedding),
      searchSinglestore(singleStoreConnection, questionEmbedding),
    ]);
    console.timeEnd("search");

    const writer = createCsvWriter({
      path: path.join(__dirname, "./data/output.csv"),
      header: [
        {
          id: "question",
          title: "Question",
        },
        {
          id: "chunkSize",
          title: "Chunk Size",
        },
        {
          id: "milvus",
          title: "Milvus",
        },
        {
          id: "qdrant",
          title: "qDrant",
        },
        {
          id: "singlestore",
          title: "SingleStore",
        },
      ],
    });

    const rows = [];

    Object.keys(questionEmbedding).forEach((question) => {
      rows.push({
        question,
        chunkSize: CHUNK_LENGTH,
        totalChunks: 0,
      });
    });

    outputs.forEach((outputs, idx) => {
      return outputs.forEach((output) => {
        const row = rows.find((row) => row.question === output.question);
        const db = ["milvus", "qdrant", "singlestore"][idx];
        row[db] = output.time;
      });
    });

    await writer.writeRecords(rows);
  } catch (err) {
    console.error(err);
  } finally {
    singleStoreConnection.end();
    process.exit();
  }
}

main();
