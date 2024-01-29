const mysql = require("mysql")

//chunk
// {
//     transcript: "",
//     participants: [],
//     embeddings: []
// }

const createTableChunks = async (connection) => {
    //participants array, embeddings array
    const query = `CREATE TABLE IF NOT EXISTS chunks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        transcript TEXT,
        embeddings vector(1536) NOT NULL,
        participants JSON
    )`;
    await connection.query(query);
}

const insertChunks = async (chunks, connection) => {
    const query = `INSERT INTO chunks (transcript, participants, embeddings) VALUES (?, ?, ?)`;

    for (const chunk of chunks) {
        // Ensure the embedding is an array of 1536 floating-point numbers
        if (chunk.embedding.length !== 1536) {
            throw new Error("Embedding array length is not 1536");
        }

        // Execute the query for each chunk
        await connection.query(query, [chunk.transcript, JSON.stringify(chunk.participants), JSON.stringify(chunk.embedding)]);
    }
};


// main is run at the end
( async () => {
    let singleStoreConnection;
    try {
        singleStoreConnection = await mysql.createConnection({
            host: 'svc-3482219c-a389-4079-b18b-d50662524e8a-shared-dml.aws-virginia-6.svc.singlestore.com',
            port: 3333,
            user: 'ali-play',
            password: "8EjXdnRUQifcPqURvfL3DxJVFosLpLkx",
            database: 'database_06865',
            ssl: {
                rejectUnauthorized: false
            }
        });

        console.log("You have successfully connected to SingleStore.");
        await createTableChunks(singleStoreConnection);
        console.log("You have successfully created the table.");
        await insertChunks(require("../gong_data/chunks-2.json"), singleStoreConnection);
        console.log("You have successfully inserted the chunks into the table.");
        
    } catch (err) {// Good programmers always handle their errors :)
        console.error('ERROR', err);
        process.exit(1);
    } finally { if (singleStoreConnection) { await singleStoreConnection.end(); } }
})();
