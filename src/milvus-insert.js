const {
  MilvusClient,
  IndexType,
  MetricType,
} = require("@zilliz/milvus2-sdk-node");

/**
 *
 * @param {MilvusClient} client
 * @param {*} chunks
 */
module.exports.insertChunksToMilvus = async (client, chunks) => {
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

  for (let idx = 0; idx < chunks.length / 500; idx++) {
    console.info("Milvus batch " + idx);

    const _chunks = chunks.slice(idx * 500, idx * 500 + 500);

    if (_chunks.length === 0) continue

    await client.insert({
      collection_name: "recordings",
      fields_data: _chunks.map((chunk, idx) => ({
        id: idx,
        transcript_embeddings: chunk.embedding,
        transcript: chunk.transcript,
        metadata: {
          participants: chunk.participants,
        },
      })),
    });
  }
  time = Date.now() - time;

  console.info("Insering complete for milvus");

  return time;
};
