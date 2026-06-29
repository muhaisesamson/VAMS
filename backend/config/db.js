const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({

    connectionString: process.env.DATABASE_URL,

    ssl: {

        rejectUnauthorized: false

    }

});

(async () => {

    try {

        const client = await pool.connect();

        console.log("✅ Connected to PostgreSQL");

        client.release();

    }
    catch (err) {

        console.error("❌ Error connecting to PostgreSQL:", err.message);

    }

})();

module.exports = pool;