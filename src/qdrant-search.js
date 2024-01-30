const { QdrantClient } = require("@qdrant/js-client-rest");

/**
 *
 * @param {QdrantClient} client
 * @param {*} questions
 */
module.exports.searchQdrant = async (client, questionEmbedding) => {
  const data = [];

  for (const [question, { embeddings }] of Object.entries(questionEmbedding)) {
    let time = Date.now();
    const res = await client.search("recordings", {
      vector: embeddings,
      limit: 5,
      with_payload: {
        include: [],
      },
      with_vector: false,
    });
    time = Date.now() - time;

    data.push({
      time,
      question,
      scores: res.map((x) => x.score),
    });
  }

  return data;
};
