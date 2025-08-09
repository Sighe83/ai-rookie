#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

async function testConnection(name, databaseUrl) {
    if (!databaseUrl) {
        console.log(`❌ ${name}: Database URL not configured`);
        return false;
    }

    try {
        const prisma = new PrismaClient({
            datasources: {
                db: { url: databaseUrl }
            }
        });

        await prisma.$connect();
        await prisma.$queryRaw`SELECT 1 as test`;
        await prisma.$disconnect();

        console.log(`✅ ${name}: Connection successful`);
        console.log(`   URL: ${databaseUrl.replace(/:[^:]*@/, ':****@')}`);
        return true;
    } catch (error) {
        console.log(`❌ ${name}: Connection failed`);
        console.log(`   Error: ${error.message}`);
        return false;
    }
}

async function main() {
    console.log('🔍 Testing database connections...\n');

    const devUrl = process.env.POSTGRES_URL_DEV;
    const prodUrl = process.env.POSTGRES_URL_PROD;

    const results = await Promise.all([
        testConnection('Development (ai-rookie-dev)', devUrl),
        testConnection('Production (ai-rookie-prod)', prodUrl)
    ]);

    const allSuccessful = results.every(result => result === true);

    console.log('\n📋 Summary:');
    console.log(`Overall Status: ${allSuccessful ? '✅ All connections successful' : '❌ Some connections failed'}`);

    process.exit(allSuccessful ? 0 : 1);
}

main().catch(console.error);