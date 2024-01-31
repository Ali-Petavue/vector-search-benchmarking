const emojiStrip = require("emoji-strip");
const fs = require("fs");
const path = require("path");

/**
 *
 * @param {import("mysql").Connection} connection
 * @param {*} chunks
 */
module.exports.insertChunksToSinglestore = async (connection) => {
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

  const files = fs.readdirSync(path.join(__dirname, "./data/chunk"));

  let fileIdx = 0;
  let totalChunks = 0;
  for (const file of files) {
    console.log("Singlestore inserting file", fileIdx++);
    const chunks = JSON.parse(
      fs.readFileSync(path.join(__dirname, "./data/chunk", file))
    );

    for (let idx = 0; idx < chunks.length / 500; idx++) {
      const _chunks = chunks.slice(idx * 500, idx * 500 + 500);
      if (_chunks.length === 0) continue;

      totalChunks += _chunks.length;
      console.info("Singlestore batch", fileIdx, idx, totalChunks);

      const query = `INSERT INTO recordings (transcript, metadata, embeddings) VALUES ${new Array(
        _chunks.length
      )
        .fill()
        .map((_) => `(?, ?, ?)`)
        .join(", ")}`;

      const data = _chunks
        .map((chunk) => [
          chunk.transcript
            .replaceAll(
              /([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g,
              ""
            )
            .replaceAll(/\s+/g, " ")
            .trim(),
          JSON.stringify({ participants: chunk.participants }),
          JSON.stringify(chunk.embedding),
        ])
        .flat();

      await new Promise((res, rej) => {
        // Execute the query for each chunk
        connection.query(
          query,
          data,
          (err) => {
            if (err) {
              return rej(err);
            }

            res();
          }
        );
      });

    }
  }
  time = Date.now() - time;

  console.info("Insertion complete for singlestore");

  return time;
};
