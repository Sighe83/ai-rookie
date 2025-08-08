const { Pool } = require('pg');
require('dotenv').config();

// Database connection using the same connection string as Prisma
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Function to get table structure from PostgreSQL
async function getTableStructure(tableName) {
  const query = `
    SELECT 
      column_name,
      data_type,
      is_nullable,
      column_default,
      character_maximum_length,
      numeric_precision,
      numeric_scale,
      udt_name
    FROM information_schema.columns
    WHERE table_name = $1
    ORDER BY ordinal_position;
  `;
  
  const result = await pool.query(query, [tableName]);
  return result.rows;
}

// Function to get all constraints for a table
async function getTableConstraints(tableName) {
  const query = `
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
    WHERE tc.table_name = $1;
  `;
  
  const result = await pool.query(query, [tableName]);
  return result.rows;
}

// Function to get all indexes for a table
async function getTableIndexes(tableName) {
  const query = `
    SELECT 
      i.relname AS index_name,
      a.attname AS column_name,
      ix.indisunique AS is_unique
    FROM pg_class t
    JOIN pg_index ix ON t.oid = ix.indrelid
    JOIN pg_class i ON i.oid = ix.indexrelid
    JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
    WHERE t.relname = $1
    AND t.relkind = 'r'
    ORDER BY i.relname, a.attname;
  `;
  
  const result = await pool.query(query, [tableName]);
  return result.rows;
}

// Prisma schema models and their expected database table names
const prismaModels = {
  User: 'users',
  Tutor: 'tutors', 
  Session: 'sessions',
  Booking: 'bookings',
  TutorTimeSlot: 'tutor_time_slots',
  SystemSettings: 'system_settings'
};

// Expected field mappings from Prisma schema
const expectedSchemas = {
  users: {
    id: { type: 'uuid', nullable: false, default: 'uuid()' },
    email: { type: 'varchar', nullable: false, unique: true },
    name: { type: 'varchar', nullable: false },
    phone: { type: 'varchar', nullable: true },
    company: { type: 'varchar', nullable: true },
    department: { type: 'varchar', nullable: true },
    role: { type: 'varchar', nullable: false, default: 'USER' },
    site_mode: { type: 'varchar', nullable: false, default: 'B2B' },
    password: { type: 'varchar', nullable: true },
    email_verified: { type: 'boolean', nullable: false, default: false },
    is_active: { type: 'boolean', nullable: false, default: true },
    created_at: { type: 'timestamp', nullable: false, default: 'now()' },
    updated_at: { type: 'timestamp', nullable: false, default: 'now()' }
  },
  tutors: {
    id: { type: 'uuid', nullable: false, default: 'uuid()' },
    user_id: { type: 'uuid', nullable: false, unique: true },
    title: { type: 'varchar', nullable: false },
    specialty: { type: 'varchar', nullable: false },
    experience: { type: 'varchar', nullable: true },
    value_prop: { type: 'varchar', nullable: true },
    img: { type: 'varchar', nullable: true },
    is_active: { type: 'boolean', nullable: false, default: true },
    created_at: { type: 'timestamp', nullable: false, default: 'now()' },
    updated_at: { type: 'timestamp', nullable: false, default: 'now()' }
  },
  sessions: {
    id: { type: 'uuid', nullable: false, default: 'uuid()' },
    tutor_id: { type: 'uuid', nullable: false },
    title: { type: 'varchar', nullable: false },
    description: { type: 'varchar', nullable: false },
    duration: { type: 'integer', nullable: false, default: 60 },
    price: { type: 'numeric', nullable: false, precision: 10, scale: 2 },
    is_active: { type: 'boolean', nullable: false, default: true },
    created_at: { type: 'timestamp', nullable: false, default: 'now()' },
    updated_at: { type: 'timestamp', nullable: false, default: 'now()' }
  },
  bookings: {
    id: { type: 'uuid', nullable: false, default: 'uuid()' },
    user_id: { type: 'uuid', nullable: false },
    tutor_id: { type: 'uuid', nullable: false },
    session_id: { type: 'uuid', nullable: false },
    format: { type: 'varchar', nullable: false },
    selected_date_time: { type: 'timestamp', nullable: false },
    participants: { type: 'integer', nullable: true, default: 1 },
    total_price: { type: 'numeric', nullable: false, precision: 10, scale: 2 },
    status: { type: 'varchar', nullable: true, default: 'PENDING' },
    site_mode: { type: 'varchar', nullable: false },
    contact_name: { type: 'varchar', nullable: false },
    contact_email: { type: 'varchar', nullable: false },
    contact_phone: { type: 'varchar', nullable: true },
    company: { type: 'varchar', nullable: true },
    department: { type: 'varchar', nullable: true },
    payment_status: { type: 'varchar', nullable: true, default: 'PENDING' },
    payment_intent_id: { type: 'varchar', nullable: true },
    payment_expires_at: { type: 'timestamp', nullable: true },
    paid_at: { type: 'timestamp', nullable: true },
    notes: { type: 'varchar', nullable: true },
    created_at: { type: 'timestamp', nullable: false, default: 'now()' },
    updated_at: { type: 'timestamp', nullable: false, default: 'now()' },
    confirmed_at: { type: 'timestamp', nullable: true },
    cancelled_at: { type: 'timestamp', nullable: true }
  },
  tutor_time_slots: {
    id: { type: 'uuid', nullable: false, default: 'uuid()' },
    tutor_id: { type: 'uuid', nullable: false },
    date: { type: 'date', nullable: false },
    start_time: { type: 'time', nullable: false },
    end_time: { type: 'time', nullable: false },
    is_available: { type: 'boolean', nullable: false, default: true },
    is_booked: { type: 'boolean', nullable: false, default: false },
    booking_id: { type: 'uuid', nullable: true },
    created_at: { type: 'timestamp', nullable: false, default: 'now()' },
    updated_at: { type: 'timestamp', nullable: false, default: 'now()' }
  }
};

// Function to compare Prisma expected vs actual database structure
function compareSchemas(tableName, actualColumns, expectedSchema) {
  const mismatches = [];
  const actualColumnMap = {};
  
  // Create a map of actual columns
  actualColumns.forEach(col => {
    actualColumnMap[col.column_name] = col;
  });
  
  // Check each expected field
  Object.entries(expectedSchema).forEach(([fieldName, expected]) => {
    const actual = actualColumnMap[fieldName];
    
    if (!actual) {
      mismatches.push({
        field: fieldName,
        issue: 'MISSING_COLUMN',
        expected: expected,
        actual: null
      });
      return;
    }
    
    // Check data type
    const actualType = mapPostgresType(actual.data_type, actual.udt_name);
    if (actualType !== expected.type && !isCompatibleType(actualType, expected.type)) {
      mismatches.push({
        field: fieldName,
        issue: 'TYPE_MISMATCH',
        expected: expected.type,
        actual: actualType,
        details: `Expected ${expected.type}, got ${actualType}`
      });
    }
    
    // Check nullable
    const actualNullable = actual.is_nullable === 'YES';
    if (actualNullable !== expected.nullable) {
      mismatches.push({
        field: fieldName,
        issue: 'NULLABLE_MISMATCH',
        expected: expected.nullable,
        actual: actualNullable,
        details: `Expected nullable: ${expected.nullable}, got: ${actualNullable}`
      });
    }
    
    // Check precision for numeric types
    if (expected.precision && actual.numeric_precision !== expected.precision) {
      mismatches.push({
        field: fieldName,
        issue: 'PRECISION_MISMATCH',
        expected: expected.precision,
        actual: actual.numeric_precision,
        details: `Expected precision: ${expected.precision}, got: ${actual.numeric_precision}`
      });
    }
    
    // Check scale for numeric types
    if (expected.scale && actual.numeric_scale !== expected.scale) {
      mismatches.push({
        field: fieldName,
        issue: 'SCALE_MISMATCH',
        expected: expected.scale,
        actual: actual.numeric_scale,
        details: `Expected scale: ${expected.scale}, got: ${actual.numeric_scale}`
      });
    }
  });
  
  // Check for extra columns in database
  actualColumns.forEach(col => {
    if (!expectedSchema[col.column_name]) {
      mismatches.push({
        field: col.column_name,
        issue: 'EXTRA_COLUMN',
        expected: null,
        actual: {
          type: mapPostgresType(col.data_type, col.udt_name),
          nullable: col.is_nullable === 'YES'
        },
        details: `Column exists in database but not in Prisma schema`
      });
    }
  });
  
  return mismatches;
}

// Map PostgreSQL data types to our expected types
function mapPostgresType(dataType, udtName) {
  const typeMap = {
    'character varying': 'varchar',
    'text': 'varchar',
    'uuid': 'uuid',
    'boolean': 'boolean',
    'integer': 'integer',
    'numeric': 'numeric',
    'timestamp with time zone': 'timestamp',
    'timestamp without time zone': 'timestamp',
    'date': 'date',
    'time without time zone': 'time',
    'time with time zone': 'time',
    'jsonb': 'json',
    'json': 'json'
  };
  
  return typeMap[dataType] || udtName || dataType;
}

// Check if types are compatible
function isCompatibleType(actual, expected) {
  const compatibleTypes = {
    'varchar': ['text', 'character varying'],
    'text': ['varchar', 'character varying'],
    'timestamp': ['timestamp with time zone', 'timestamp without time zone'],
    'time': ['time with time zone', 'time without time zone']
  };
  
  return compatibleTypes[expected]?.includes(actual) || compatibleTypes[actual]?.includes(expected);
}

// Main function to run the comparison
async function runSchemaComparison() {
  console.log('🔍 Starting Prisma Schema vs Database Comparison...\n');
  
  const reportData = {
    timestamp: new Date().toISOString(),
    tablesChecked: [],
    totalMismatches: 0,
    summary: {}
  };
  
  try {
    // Focus on the main models as requested
    const tablesToCheck = ['users', 'tutors', 'sessions', 'bookings', 'tutor_time_slots'];
    
    for (const tableName of tablesToCheck) {
      console.log(`\n📋 Checking table: ${tableName}`);
      console.log('='.repeat(50));
      
      try {
        const actualColumns = await getTableStructure(tableName);
        const constraints = await getTableConstraints(tableName);
        const indexes = await getTableIndexes(tableName);
        
        if (actualColumns.length === 0) {
          console.log(`❌ Table '${tableName}' not found in database`);
          reportData.summary[tableName] = {
            status: 'TABLE_MISSING',
            mismatches: [],
            error: `Table '${tableName}' does not exist in the database`
          };
          continue;
        }
        
        console.log(`✅ Found table '${tableName}' with ${actualColumns.length} columns`);
        
        // Compare with expected schema
        const expectedSchema = expectedSchemas[tableName];
        if (!expectedSchema) {
          console.log(`⚠️  No expected schema defined for table '${tableName}'`);
          continue;
        }
        
        const mismatches = compareSchemas(tableName, actualColumns, expectedSchema);
        
        reportData.tablesChecked.push(tableName);
        reportData.totalMismatches += mismatches.length;
        reportData.summary[tableName] = {
          status: mismatches.length === 0 ? 'MATCH' : 'MISMATCH',
          mismatches: mismatches,
          columnCount: actualColumns.length,
          constraintCount: constraints.length,
          indexCount: indexes.length
        };
        
        if (mismatches.length === 0) {
          console.log('✅ Schema matches perfectly!');
        } else {
          console.log(`❌ Found ${mismatches.length} mismatch(es):`);
          mismatches.forEach((mismatch, index) => {
            console.log(`\n  ${index + 1}. Field: ${mismatch.field}`);
            console.log(`     Issue: ${mismatch.issue}`);
            console.log(`     Details: ${mismatch.details || 'N/A'}`);
            if (mismatch.expected !== null) {
              console.log(`     Expected: ${JSON.stringify(mismatch.expected)}`);
            }
            if (mismatch.actual !== null) {
              console.log(`     Actual: ${JSON.stringify(mismatch.actual)}`);
            }
          });
        }
        
        // Show actual column details for debugging
        console.log(`\n📊 Actual columns in '${tableName}':`);
        actualColumns.forEach(col => {
          const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
          const defaultValue = col.column_default ? ` DEFAULT ${col.column_default}` : '';
          console.log(`  - ${col.column_name}: ${col.data_type} ${nullable}${defaultValue}`);
        });
        
      } catch (error) {
        console.error(`❌ Error checking table '${tableName}':`, error.message);
        reportData.summary[tableName] = {
          status: 'ERROR',
          mismatches: [],
          error: error.message
        };
      }
    }
    
    // Generate final report
    console.log('\n' + '='.repeat(80));
    console.log('📊 FINAL SCHEMA COMPARISON REPORT');
    console.log('='.repeat(80));
    console.log(`Timestamp: ${reportData.timestamp}`);
    console.log(`Tables checked: ${reportData.tablesChecked.length}`);
    console.log(`Total mismatches found: ${reportData.totalMismatches}`);
    
    console.log('\n📋 Summary by table:');
    Object.entries(reportData.summary).forEach(([tableName, data]) => {
      const statusEmoji = data.status === 'MATCH' ? '✅' : 
                         data.status === 'TABLE_MISSING' ? '🚫' :
                         data.status === 'ERROR' ? '💥' : '❌';
      console.log(`  ${statusEmoji} ${tableName}: ${data.status}`);
      if (data.mismatches.length > 0) {
        console.log(`    └── ${data.mismatches.length} mismatch(es) found`);
      }
      if (data.error) {
        console.log(`    └── Error: ${data.error}`);
      }
    });
    
    // Recommendations
    if (reportData.totalMismatches > 0) {
      console.log('\n🛠️  RECOMMENDATIONS:');
      console.log('1. Run "npx prisma db pull" to sync your Prisma schema with the database');
      console.log('2. Or run "npx prisma db push" to update the database to match your schema');
      console.log('3. Review each mismatch carefully before making changes');
      console.log('4. Consider creating a backup before applying schema changes');
    } else {
      console.log('\n🎉 All schemas match perfectly! No action needed.');
    }
    
    // Save detailed report to file
    const fs = require('fs');
    const reportPath = '/Users/danielelkjaer/Desktop/AI-rookie 2/Untitled/backend/schema-comparison-report.json';
    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
    console.log(`\n💾 Detailed report saved to: ${reportPath}`);
    
  } catch (error) {
    console.error('💥 Fatal error during schema comparison:', error);
  } finally {
    await pool.end();
  }
}

// Run the comparison
if (require.main === module) {
  runSchemaComparison().catch(console.error);
}

module.exports = { runSchemaComparison };