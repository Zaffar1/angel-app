const connectDB = require('../../config/db');

/**
 * Get all tables and row counts in the active database
 */
async function getAllTables() {
    const pool = await connectDB();
    const [dbResult] = await pool.query('SELECT DATABASE() AS dbName');
    const dbName = dbResult[0]?.dbName;

    if (!dbName) {
        throw new Error('No active database selected in MySQL connection');
    }

    const [tables] = await pool.query(
        `SELECT 
       table_name AS tableName, 
       table_type AS tableType, 
       table_rows AS estimatedRows 
     FROM information_schema.tables 
     WHERE table_schema = ? 
     ORDER BY table_name ASC`,
        [dbName]
    );

    return {
        database: dbName,
        count: tables.length,
        tables
    };
}

/**
 * Drop all database tables and views safely
 * - Disables foreign key checks (SET FOREIGN_KEY_CHECKS = 0)
 * - Drops all views and base tables
 * - Restores foreign key checks in a finally block
 */
async function dropAllTables() {
    const pool = await connectDB();
    const connection = await pool.getConnection();

    try {
        const [dbResult] = await connection.query('SELECT DATABASE() AS dbName');
        const dbName = dbResult[0]?.dbName;

        if (!dbName) {
            throw new Error('No active database selected in MySQL connection');
        }

        // 1. Fetch all base tables
        const [tables] = await connection.query(
            `SELECT table_name AS tableName 
       FROM information_schema.tables 
       WHERE table_schema = ? AND table_type = 'BASE TABLE'`,
            [dbName]
        );

        // 2. Fetch all views
        const [views] = await connection.query(
            `SELECT table_name AS viewName 
       FROM information_schema.views 
       WHERE table_schema = ?`,
            [dbName]
        );

        const tableNames = tables.map(t => t.tableName);
        const viewNames = views.map(v => v.viewName);

        if (tableNames.length === 0 && viewNames.length === 0) {
            return {
                database: dbName,
                droppedTablesCount: 0,
                droppedViewsCount: 0,
                droppedTables: [],
                droppedViews: [],
                message: `Database '${dbName}' is already empty. No tables or views found.`
            };
        }

        // 3. Disable foreign key checks for this dedicated connection
        await connection.query('SET FOREIGN_KEY_CHECKS = 0');

        // 4. Drop views first
        for (const view of viewNames) {
            await connection.query(`DROP VIEW IF EXISTS \`${view}\``);
        }

        // 5. Drop each table
        for (const table of tableNames) {
            await connection.query(`DROP TABLE IF EXISTS \`${table}\``);
        }

        return {
            database: dbName,
            droppedTablesCount: tableNames.length,
            droppedViewsCount: viewNames.length,
            droppedTables: tableNames,
            droppedViews: viewNames,
            timestamp: new Date().toISOString(),
            message: `Successfully dropped ${tableNames.length} table(s) and ${viewNames.length} view(s) from database '${dbName}'.`
        };

    } finally {
        try {
            // Re-enable foreign key checks
            await connection.query('SET FOREIGN_KEY_CHECKS = 1');
        } catch (err) {
            console.error('Error restoring FOREIGN_KEY_CHECKS:', err);
        }
        connection.release();
    }
}

module.exports = {
    getAllTables,
    dropAllTables
};
