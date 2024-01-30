const { QdrantClient } = require("@qdrant/js-client-rest");

/**
 *
 * @param {QdrantClient} client
 * @param {any} chunks
 */
module.exports.insertChunksToQdrant = async (client, chunks) => {
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
  for (let idx = 0; idx < chunks.length / 500; idx++) {
    console.info("Qdrant batch " + idx);

    const _chunks = chunks.slice(idx * 500, idx * 500 + 500);

    if (_chunks.length === 0) continue;

    await client.upsert("recordings", {
      points: _chunks.map((c, i) => ({
        id: i,
        vector: c.embedding,
        payload: {
          transcript: c.transcript,
          metadata: { participants: c.participants },
        },
      })),
    });
  }
  time = Date.now() - time;

  console.info("Insertion complete for qdrant");
  return time;
};
