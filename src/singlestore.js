const mysql = require("mysql")

// TODO: adjust these connection details to match your SingleStore deployment:
const HOST = 'svc-3482219c-a389-4079-b18b-d50662524e8a-shared-dml.aws-virginia-6.svc.singlestore.com';
const USER = 'ali-play';
const PASSWORD = '8EjXdnRUQifcPqURvfL3DxJVFosLpLkx';
const DATABASE = 'database_06865';

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
        
    } catch (err) {// Good programmers always handle their errors :)
        console.error('ERROR', err);
        process.exit(1);
    } finally { if (singleStoreConnection) { await singleStoreConnection.end(); } }
})();
