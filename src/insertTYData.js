const { parse } = require("csv");
const fs = require("fs");
const path = require("path");

function main() {
  const raw = [];
  const chunk = [];
  let idx = 0;

  new fs.ReadStream(path.join(__dirname, "./data/2023-11-07_times_sum_1.csv"))
    .pipe(
      parse({
        delimiter: ";",
        relax_quotes: true,
        autoParse: true,
        from_line: 2,
        relax_column_count: true,
      })
    )
    .on("data", (data) => {
      try {
        chunk.push({
          transcript: data[0],
          participants: [],
          embedding: JSON.parse(data[9]),
        });

        raw.push({
          speaker: "",
          time: 0,
          text: data[0],
        });
      } catch (err) {
        return;
      }

      if (chunk.length === 10000) {
        writeToDisk(chunk, raw, idx);
        idx++;
        chunk.length = 0;
        raw.length = 0;
      }
    })
    .on("end", () => {
      writeToDisk(chunk, raw, idx);
      process.exit();
    });
}

function writeToDisk(chunk, raw, idx) {
  console.log(idx, chunk.length, raw.length);

  fs.writeFileSync(
    path.join(__dirname, `./data/raw/nyt${idx}.json`),
    JSON.stringify(raw)
  );

  fs.writeFileSync(
    path.join(__dirname, `./data/chunk/nyt${idx}.json`),
    JSON.stringify(chunk)
  );
}

main();
