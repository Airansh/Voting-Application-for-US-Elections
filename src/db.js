const mysql = require('mysql2/promise');
const config = require('./config');

// A pool reconnects automatically and lets concurrent socket handlers run
// queries in parallel, unlike a single shared connection.
const pool = mysql.createPool({
    ...config.db,
    waitForConnections: true,
    connectionLimit: 10,
    dateStrings: true,
});

async function query(sql, params = []) {
    const [rows] = await pool.query(sql, params);
    return rows;
}

// Runs fn(connection) inside a transaction, committing on success and rolling
// back if it throws. Resolves with fn's return value.
async function transaction(fn) {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const result = await fn(conn);
        await conn.commit();
        return result;
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
}

module.exports = { pool, query, transaction };
