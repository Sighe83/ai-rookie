require('dotenv').config();
const { Client } = require('pg');

const connectionString = process.env.DATABASE_URL;

async function testDbConnection() {
    const client = new Client({
        connectionString: connectionString,
    });

    try {
        await client.connect();
        console.log('Successfully connected to the Supabase database!');

        const tablesRes = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';");
        const tableNames = tablesRes.rows.map(row => row.table_name);

        for (const tableName of tableNames) {
            console.log(`\n--- Table: ${tableName} ---`);
            const columnsRes = await client.query(`
                SELECT column_name, data_type, is_nullable, column_default
                FROM information_schema.columns
                WHERE table_schema = 'public' AND table_name = $1
                ORDER BY ordinal_position;
            `, [tableName]);

            columnsRes.rows.forEach(col => {
                console.log(`  - ${col.column_name} (${col.data_type}, Nullable: ${col.is_nullable}, Default: ${col.column_default})`);
            });
        }

    } catch (error) {
        console.error('Failed to connect to or query the Supabase database:', error.message);
    } finally {
        await client.end();
    }
}

testDbConnection();