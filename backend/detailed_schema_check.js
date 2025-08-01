require('dotenv').config();
const { Client } = require('pg');

const connectionString = process.env.DATABASE_URL;

async function detailedSchemaCheck() {
    const client = new Client({
        connectionString: connectionString,
    });

    try {
        await client.connect();
        console.log('=== DETAILED SCHEMA ANALYSIS ===\n');

        // Get all tables
        const tablesRes = await client.query(`
            SELECT table_name FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
            ORDER BY table_name;
        `);
        const tableNames = tablesRes.rows.map(row => row.table_name);
        
        console.log('📋 TABLES FOUND:', tableNames);
        console.log('\n' + '='.repeat(80) + '\n');

        for (const tableName of tableNames) {
            console.log(`🗂️  TABLE: ${tableName.toUpperCase()}`);
            console.log('-'.repeat(50));

            // Get columns with detailed info
            const columnsRes = await client.query(`
                SELECT 
                    column_name, 
                    data_type, 
                    is_nullable, 
                    column_default,
                    character_maximum_length,
                    numeric_precision,
                    numeric_scale
                FROM information_schema.columns
                WHERE table_schema = 'public' AND table_name = $1
                ORDER BY ordinal_position;
            `, [tableName]);

            console.log('📝 COLUMNS:');
            columnsRes.rows.forEach(col => {
                const nullable = col.is_nullable === 'YES' ? '✅ NULL' : '❌ NOT NULL';
                const defaultVal = col.column_default ? `DEFAULT: ${col.column_default}` : 'NO DEFAULT';
                console.log(`   • ${col.column_name} (${col.data_type}) ${nullable} ${defaultVal}`);
            });

            // Get constraints
            const constraintsRes = await client.query(`
                SELECT 
                    tc.constraint_name,
                    tc.constraint_type,
                    kcu.column_name,
                    ccu.table_name AS foreign_table_name,
                    ccu.column_name AS foreign_column_name
                FROM information_schema.table_constraints tc
                LEFT JOIN information_schema.key_column_usage kcu
                    ON tc.constraint_name = kcu.constraint_name
                LEFT JOIN information_schema.constraint_column_usage ccu
                    ON tc.constraint_name = ccu.constraint_name
                WHERE tc.table_name = $1 AND tc.table_schema = 'public'
                ORDER BY tc.constraint_type, tc.constraint_name;
            `, [tableName]);

            if (constraintsRes.rows.length > 0) {
                console.log('🔒 CONSTRAINTS:');
                constraintsRes.rows.forEach(constraint => {
                    const type = constraint.constraint_type;
                    const name = constraint.constraint_name;
                    const column = constraint.column_name;
                    
                    if (type === 'FOREIGN KEY') {
                        console.log(`   • FK: ${column} → ${constraint.foreign_table_name}.${constraint.foreign_column_name}`);
                    } else if (type === 'PRIMARY KEY') {
                        console.log(`   • PK: ${column}`);
                    } else if (type === 'UNIQUE') {
                        console.log(`   • UNIQUE: ${column}`);
                    } else {
                        console.log(`   • ${type}: ${column || name}`);
                    }
                });
            }

            // Get indexes
            const indexesRes = await client.query(`
                SELECT 
                    indexname,
                    indexdef
                FROM pg_indexes
                WHERE tablename = $1 AND schemaname = 'public'
                ORDER BY indexname;
            `, [tableName]);

            if (indexesRes.rows.length > 0) {
                console.log('📇 INDEXES:');
                indexesRes.rows.forEach(idx => {
                    console.log(`   • ${idx.indexname}`);
                });
            }

            console.log('\n' + '='.repeat(80) + '\n');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await client.end();
    }
}

detailedSchemaCheck();