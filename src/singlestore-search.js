const mysql = require("mysql");

/**
 *
 * @param {mysql.Connection} connection
 * @param {*} questions
 */
module.exports.searchSinglestore = async (connection, questionEmbedding) => {
  let data = [];

  for (const [question, { embeddings }] of Object.entries(questionEmbedding)) {
    let time = Date.now();

    const res = await new Promise((resolve, reject) => {
      const vectorSearchQuery = `SELECT metadata, dot_product(embeddings, JSON_ARRAY_PACK(?)) AS similarity
            FROM recordings 
            ORDER BY similarity DESC 
            LIMIT ?`;

      connection.query(vectorSearchQuery, [JSON.stringify(embeddings), 5], (error, results) => {
        if (error) {
          return reject(error);
        }

        resolve(results);
      });
    });

    time = Date.now() - time;

    data.push({
      time,
      question,
      scores: res.map((r) => r.similarity),
    });
  }

  return data;
};
