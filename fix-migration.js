const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');

// Get database URL from environment
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL environment variable is required');
  process.exit(1);
}

const sql = postgres(connectionString);
const db = drizzle(sql);

async function fixGeographicFocusColumn() {
  try {
    console.log('Checking if geographic_focus column exists...');

    // Check if column exists
    const result = await sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'risk_assessments'
      AND column_name = 'geographic_focus'
    `;

    if (result.length === 0) {
      console.log('Column geographic_focus does not exist. Adding it...');
      await sql`
        ALTER TABLE "risk_assessments"
        ADD COLUMN "geographic_focus" jsonb NOT NULL DEFAULT '[]'::jsonb
      `;
      console.log('✅ Successfully added geographic_focus column');
    } else {
      console.log('Column geographic_focus already exists');
    }

    // Check if dividend_vs_growth column exists
    const dividendResult = await sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'risk_assessments'
      AND column_name = 'dividend_vs_growth'
    `;

    if (dividendResult.length === 0) {
      console.log('Column dividend_vs_growth does not exist. Adding it...');
      await sql`
        ALTER TABLE "risk_assessments"
        ADD COLUMN "dividend_vs_growth" varchar
      `;
      console.log('✅ Successfully added dividend_vs_growth column');
    } else {
      console.log('Column dividend_vs_growth already exists');
    }

  } catch (error) {
    console.error('❌ Error fixing columns:', error);
  } finally {
    await sql.end();
  }
}

fixGeographicFocusColumn();
