import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export async function initializeDatabase() {
  let connection;

  try {
    console.log('🔌 Connecting to MySQL server...');
    
    // First connect without database to create it
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3307'),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      multipleStatements: true
    });

    console.log('✅ Connected to MySQL server');

    // Read and execute schema
    console.log('📦 Reading schema file...');
    const schemaPath = path.join(process.cwd(), 'database', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    console.log('🔨 Creating database and tables...');
    await connection.query(schema);

    console.log('✅ Database schema created successfully');

    // Switch to our database
    await connection.query(`USE our_story`);

    // Check if users exist
    const [users] = await connection.query('SELECT COUNT(*) as count FROM users');
    const userCount = (users as any)[0].count;

    if (userCount === 0) {
      console.log('👥 Creating initial users...');
      
      const hashedPassword1 = bcrypt.hashSync('password1', 10);
      const hashedPassword2 = bcrypt.hashSync('password2', 10);
      
      await connection.query(
        'INSERT INTO users (username, display_name, password) VALUES (?, ?, ?)',
        ['partner1', 'Partner 1', hashedPassword1]
      );
      await connection.query(
        'INSERT INTO users (username, display_name, password) VALUES (?, ?, ?)',
        ['partner2', 'Partner 2', hashedPassword2]
      );
      
      console.log('✅ Initial users created');
    }

    // Check if templates exist
    const [templates] = await connection.query('SELECT COUNT(*) as count FROM letter_templates');
    const templateCount = (templates as any)[0].count;

    if (templateCount === 0) {
      console.log('💌 Creating letter templates...');
      
      const letterTemplates = [
        {
          name: 'Romantic Love Letter',
          category: 'Romance',
          content: 'My Dearest [NAME],\n\nEvery moment with you feels like a dream come true. [MEMORY] is something I will cherish forever.\n\nYou make me feel [FEELING], and I am so grateful to have you in my life.\n\nWith all my love,\n[YOUR_NAME]',
          placeholders: JSON.stringify(['NAME', 'MEMORY', 'FEELING', 'YOUR_NAME'])
        },
        {
          name: 'Appreciation Letter',
          category: 'Gratitude',
          content: 'Dear [NAME],\n\nI wanted to take a moment to tell you how much I appreciate [WHAT_THEY_DID]. It meant the world to me.\n\nYour [QUALITY] always amazes me, and I feel so lucky to share my life with you.\n\nThank you for being you.\n\nLove always,\n[YOUR_NAME]',
          placeholders: JSON.stringify(['NAME', 'WHAT_THEY_DID', 'QUALITY', 'YOUR_NAME'])
        },
        {
          name: 'Missing You',
          category: 'Longing',
          content: 'My Love [NAME],\n\nI miss you more than words can express. Being apart from you makes me realize how much you mean to me.\n\nI can\'t wait until [WHEN_TOGETHER_AGAIN] when we can [ACTIVITY] together again.\n\nCounting down the moments until I see you.\n\nYours forever,\n[YOUR_NAME]',
          placeholders: JSON.stringify(['NAME', 'WHEN_TOGETHER_AGAIN', 'ACTIVITY', 'YOUR_NAME'])
        }
      ];

      for (const template of letterTemplates) {
        await connection.query(
          'INSERT INTO letter_templates (name, category, content, placeholders) VALUES (?, ?, ?, ?)',
          [template.name, template.category, template.content, template.placeholders]
        );
      }
      
      console.log('✅ Letter templates created');
    }

    console.log('\n🎉 Database initialization complete!');
    console.log('\n📊 Database Info:');
    console.log(`   Host: ${process.env.DB_HOST || 'localhost'}`);
    console.log(`   Port: ${process.env.DB_PORT || '3307'}`);
    console.log(`   Database: ${process.env.DB_NAME || 'our_story'}`);
    console.log('\n🔑 Default Credentials:');
    console.log('   Username: partner1 | Password: password1');
    console.log('   Username: partner2 | Password: password2');

  } catch (error) {
    console.error('❌ Error initializing database:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run if called directly
initializeDatabase()
  .then(() => {
    console.log('✅ Database initialization completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Initialization failed:', error);
    process.exit(1);
  });
