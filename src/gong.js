const { default: axios } = require("axios");
const fs = require("fs");
const path = require("path");

module.exports.getCallsFromGong = async () => {
  const token = Buffer.from(
    process.env.GONG_KEY + ":" + process.env.GONG_SECRET
  ).toString("base64");

  let cursor;

  while (true) {
    const callsRes = await axios.get("/v2/calls", {
      params: {
        fromDateTime: "2000-02-17T02:30:00-08:00",
        toDateTime: "2024-02-19T02:30:00-08:00",
        cursor,
      },
      headers: {
        Authorization: "Basic " + token,
      },
      baseURL: process.env.GONG_BASE_URL,
    });

    if (callsRes.data.records.currentPageSize === 0) {
      break;
    }

    cursor = callsRes.data.records.cursor;

    const calls = callsRes.data.calls.filter(
      (call) =>
        !fs.existsSync(path.join(__dirname, "./data/raw", `${call.id}.json`))
    );

    if (calls.length === 0) {
      if (callsRes.data.records.currentPageSize < 100) {
        break;
      }

      continue;
    };

    const transcriptRes = await axios.post(
      "/v2/calls/transcript",
      {
        filter: {
          callIds: calls.map((call) => call.id),
        },
      },
      {
        baseURL: process.env.GONG_BASE_URL,
        headers: {
          Authorization: "Basic " + token,
        },
      }
    );

    const extensiveRes = await axios.post(
      "/v2/calls/extensive",
      {
        filter: {
          callIds: calls.map((call) => call.id),
        },
        contentSelector: {
          exposedFields: {
            parties: true,
          },
        },
      },
      {
        baseURL: process.env.GONG_BASE_URL,
        headers: {
          Authorization: "Basic " + token,
        },
      }
    );

    calls.forEach((call, idx) => {
      console.log(idx, call.id);
      const data = [];

      const transcript = transcriptRes.data.callTranscripts.find(
        (callTranscript) => callTranscript.callId == call.id
      ).transcript;
      const extensive = extensiveRes.data.calls.find(
        (_call) => _call.metaData.id == call.id
      );

      transcript.forEach((block) => {
        const { name: speaker } = extensive.parties.find(
          (party) => party.speakerId == block.speakerId
        ) || { name: "" };

        block.sentences.forEach((sentence) => {
          const minutes = Math.floor(sentence.start / 60 / 1000);
          const seconds = Math.floor((sentence.start / 1000) % 60);

          const time = `${minutes}:${seconds}`;

          data.push({
            speaker,
            time,
            text: sentence.text,
          });
        });
      });

      fs.writeFileSync(
        path.join(__dirname, "./data/raw", `${call.id}.json`),
        JSON.stringify(data, undefined, 2)
      );
    });
  }
};
