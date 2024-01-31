const {
  MilvusClient,
  IndexType,
  MetricType,
} = require("@zilliz/milvus2-sdk-node");
const emojiStrip = require("emoji-strip");
const fs = require("fs");
const path = require("path");

/**
 *
 * @param {MilvusClient} client
 * @param {*} chunks
 */
module.exports.insertChunksToMilvus = async (client) => {
  const collectionsExists = await client.hasCollection({
    collection_name: "recordings",
  });

  if (collectionsExists) {
    console.info("Dropping collection from milvs");
    await client.dropCollection({
      collection_name: "recordings",
    });
  }

  console.info("Creating collection in milvus");
  await client.createCollection({
    collection_name: "recordings",
    dimension: 1536,
    fields: [
      {
        name: "id",
        is_primary_key: true,
        data_type: "Int64",
      },
      {
        name: "transcript_embeddings",
        data_type: "FloatVector",
        dim: 1536,
      },
      {
        name: "transcript",
        data_type: "VarChar",
        max_length: 3000,
      },
      {
        name: "metadata",
        data_type: "JSON",
      },
    ],
  });

  console.info("Creating index in milvus");
  await client.createIndex({
    collection_name: "recordings",
    field_name: "transcript_embeddings",
    index_type: IndexType.AUTOINDEX,
    metric_type: MetricType.IP,
  });

  console.info("Starting insertion in milvus");
  let time = Date.now();

  const files = fs.readdirSync(path.join(__dirname, "./data/chunk"));

  let rowIdx = 0
  for (const file of files) {
    const chunks = JSON.parse(
      fs.readFileSync(path.join(__dirname, "./data/chunk", file))
    );

    for (let idx = 0; idx < chunks.length / 500; idx++) {
      console.info("Milvus batch " + idx);

      const _chunks = chunks.slice(idx * 500, idx * 500 + 500);

      if (_chunks.length === 0) continue;

      await client.insert({
        collection_name: "recordings",
        fields_data: _chunks.map((chunk) => ({
          id: rowIdx++,
          transcript_embeddings: chunk.embedding,
          transcript: chunk.transcript
            .replaceAll(
              /([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g,
              ""
            )
            .replaceAll(/\s+/g, " ")
            .trim(),
          metadata: {
            participants: chunk.participants,
          },
        })),
      });
    }
  }

  time = Date.now() - time;

  console.info("Insering complete for milvus");

  return time;
};
