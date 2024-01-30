const BPromise = require("bluebird");

/**
 *
 * @param {import("mysql").Connection} connection
 * @param {*} chunks
 */
module.exports.insertChunksToSinglestore = async (connection, chunks) => {
  console.info("Dropping collection from singlestore");
  await new Promise((res, rej) => {
    connection.query(`DROP TABLE IF EXISTS recordings`, (err, results) => {
      if (err) {
        return rej(err);
      }

      res(results);
    });
  });

  console.info("Creating table in singlestore");
  await new Promise(async (res, rej) => {
    const query = `CREATE TABLE recordings (
          id INT AUTO_INCREMENT PRIMARY KEY,
          transcript TEXT NOT NULL,
          embeddings vector(1536) NOT NULL,
          metadata JSON NOT NULL,
          VECTOR INDEX (embeddings) INDEX_OPTIONS '{"index_type":"IVF_FLAT", "nlist":2, "nprobe":1}')`;

    connection.query(query, (err, results) => {
      if (err) {
        return rej(err);
      }

      res(results);
    });
  });

  console.info("Starting insertion in singlestore");
  let time = Date.now();

  for (let idx = 0; idx < chunks.length / 500; idx++) {
    console.info("Singlestore batch " + idx);

    const _chunks = chunks.slice(idx * 500, idx * 500 + 500);
    if (_chunks.length === 0) continue;

    const query = `INSERT INTO recordings (transcript, metadata, embeddings) VALUES (?)`;

    await new Promise((res, rej) => {
      // Execute the query for each chunk
      connection.query(
        query,
        _chunks.map((chunk) => [
          chunk.transcript,
          JSON.stringify({ participants: chunk.participants }),
          JSON.stringify(chunk.embedding),
        ]),
        (err) => {
          if (err) {
            return rej(err);
          }

          res();
        }
      );
    });
  }
  time = Date.now() - time;

  console.info("Insertion complete for singlestore");

  return time;
};
