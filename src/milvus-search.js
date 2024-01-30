const { MilvusClient, DataType } = require("@zilliz/milvus2-sdk-node");

/**
 *
 * @param {MilvusClient} client
 * @param {*} questions
 */
module.exports.searchMilvus = async (client, questionEmbedding) => {
  const data = [];

  // await client.loadCollection({
  //   collection_name: "recordings",
  // });

  // await waitForLoading(client);

  for (const [question, { embeddings }] of Object.entries(questionEmbedding)) {
    let time = Date.now();
    const res = await client.search({
      collection_name: "recordings",
      vector: embeddings,
      vector_type: DataType.FloatVector,
      limit: 5,
    });
    time = Date.now() - time;

    data.push({
      time,
      question,
      scores: res.results.map((r) => r.score),
    });
  }

  return data;
};

/**
 *
 * @param {MilvusClient} client
 */
async function waitForLoading(client) {
  await new Promise((res) => {
    async function recursivelyCheckProgress() {
      const { progress } = await client.getLoadingProgress({
        collection_name: "recordings",
      });

      if (progress === "100") {
        return res();
      }

      setTimeout(() => {
        recursivelyCheckProgress(client);
      }, 100);
    }

    recursivelyCheckProgress();
  });
}
