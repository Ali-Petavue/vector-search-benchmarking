const { CharacterTextSplitter } =  require("langchain/text_splitter");

const text = "0:00: Abhishek: Hello? \n0:04: Bhaskar: I have wf, fetch from home that's why I can. \n0:06: Abhishek: Could join today. \n0:10: Bhaskar: Every day. I'm usually traveling at the distance. \n0:12: Jeyaraj: The… hello, cto, sir. Hey, sub man. Good morning. Hello. \n0:25: Gnana: I… \n0:26: Jeyaraj: Set up a call man and a bus Baker. We, we just get on a call and does the Salesforce integration? Okay? Any issues or anything pending that has to be merged? \n0:40: Bhaskar: Or is fine, only that we will need some account where there are, some data actually. Okay. My account also has a data. Maybe what I'll do is in the contact. I didn't have the data contacts are in my account. Okay? One sec. \n";
const splitter = new CharacterTextSplitter({
  separator: " ",
  chunkSize: 10,
  chunkOverlap: 3,
});
(async () => {
    const output = await splitter.createDocuments([text]);
    console.log(output)
})()