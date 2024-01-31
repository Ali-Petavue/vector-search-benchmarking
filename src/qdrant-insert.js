const { QdrantClient } = require("@qdrant/js-client-rest");
const emojiStrip = require("emoji-strip");
const fs = require("fs");
const path = require("path");

/**
 *
 * @param {QdrantClient} client
 * @param {any} chunks
 */
module.exports.insertChunksToQdrant = async (client) => {
  const { collections } = await client.getCollections();

  const recordingsCollectionExists = collections.find(
    (c) => c.name === "recordings"
  );

  if (recordingsCollectionExists) {
    console.log("Dropping collection from qdrant");
    await client.deleteCollection("recordings");
  }

  console.log("Creating collection in qdrant");
  await client.createCollection("recordings", {
    vectors: {
      distance: "Dot",
      size: 1536,
    },
  });

  console.log("Starting insertion in adrant");
  let time = Date.now();

  const files = fs.readdirSync(path.join(__dirname, "./data/chunk"));

  let rowIdx = 0;
  for (const file of files) {
    const chunks = JSON.parse(
      fs.readFileSync(path.join(__dirname, "./data/chunk", file))
    );

    for (let idx = 0; idx < chunks.length / 500; idx++) {
      console.info("Qdrant batch " + idx);

      const _chunks = chunks.slice(idx * 500, idx * 500 + 500);

      if (_chunks.length === 0) continue;

      await client.upsert("recordings", {
        points: _chunks.map((c) => ({
          id: rowIdx++,
          vector: c.embedding,
          payload: {
            transcript: c.transcript
              .replaceAll(
                /([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g,
                ""
              )
              .replaceAll(/\s+/g, " ")
              .trim(),
            metadata: { participants: c.participants },
          },
        })),
      });
    }
  }
  time = Date.now() - time;

  console.info("Insertion complete for qdrant");
  return time;
};
