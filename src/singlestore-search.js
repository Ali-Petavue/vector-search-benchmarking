
const mysql = require("mysql")

const singleStoreVectorSearch = async (connection, query, limit) => {
    return new Promise((resolve, reject) => {
        const vectorSearchQuery = `SELECT transcript, participants, dot_product(embeddings, JSON_ARRAY_PACK(?)) AS similarity
        FROM chunks 
        ORDER BY similarity DESC 
        LIMIT ?`;
        connection.query(vectorSearchQuery, [query, limit], (error, results) => {
            if (error) {
                reject(error);
            } else {
                resolve(results);
            }
        });
    });
}

(async ()=>{
    const questions = require("../gong_data/questions.json");
    const singleStoreConnection = await mysql.createConnection({
        host: 'svc-3482219c-a389-4079-b18b-d50662524e8a-shared-dml.aws-virginia-6.svc.singlestore.com',
        port: 3333,
        user: 'ali-play',
        password: "8EjXdnRUQifcPqURvfL3DxJVFosLpLkx",
        database: 'database_06865',
        ssl: {
            rejectUnauthorized: false
        }
    });
    console.log("connected")
    for(let question of questions){
        if (question.embedding.length !== 1536) {
            throw new Error("Embedding array length does not match the expected size.");
        }
        
        const results = await singleStoreVectorSearch(singleStoreConnection, JSON.stringify(question.embedding), 3)
        console.log("question =>",question.question,"results =>",results)
        break;
    }

})()