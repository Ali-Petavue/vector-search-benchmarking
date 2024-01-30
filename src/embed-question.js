const { default: OpenAI } = require("openai");

/**
 * @param {OpenAI} openai
 */
module.exports.embedQuestion = async (openai, questions) => {
  const res = await openai.embeddings.create({
    input: questions,
    model: "text-embedding-3-small",
  });

  return res;
};
