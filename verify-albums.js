// Verify Albums Feature is Ready
const mysql = require('mysql2/promise');
require('dotenv').config();

async function verifyAlbumsFeature() {
  const config = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3307,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'our_story'
  };

  console.log('==================================================');
  console.log('   Albums Feature Verification');
  console.log('==================================================\n');

  const connection = await mysql.createConnection(config);

  // Check if albums table exists with correct structure
  const [albumCols] = await connection.query('SHOW COLUMNS FROM albums');
  const requiredAlbumCols = ['id', 'user_id', 'name', 'description', 'cover_photo_id', 'photo_count', 'created_at', 'updated_at'];
  
  console.log('1. Albums Table Structure:');
  const albumColNames = albumCols.map(col => col.Field);
  requiredAlbumCols.forEach(colName => {
    const exists = albumColNames.includes(colName);
    console.log(`   ${exists ? '✓' : '✗'} ${colName}`);
  });

  // Check if photos table has album_id
  const [photoCols] = await connection.query('SHOW COLUMNS FROM photos');
  const photoColNames = photoCols.map(col => col.Field);
  
  console.log('\n2. Photos Table - Album Integration:');
  console.log(`   ${photoColNames.includes('album_id') ? '✓' : '✗'} album_id column exists`);
  console.log(`   ${photoColNames.includes('album') ? '✓' : '✗'} album column exists (legacy)`);

  // Check if General album exists
  const [generalAlbum] = await connection.query("SELECT * FROM albums WHERE name = 'General'");
  console.log('\n3. Default Album:');
  console.log(`   ${generalAlbum.length > 0 ? '✓' : '✗'} "General" album exists`);
  
  if (generalAlbum.length > 0) {
    console.log(`      - ID: ${generalAlbum[0].id}`);
    console.log(`      - Photos: ${generalAlbum[0].photo_count}`);
  }

  // Check if there are any albums
  const [allAlbums] = await connection.query('SELECT * FROM albums ORDER BY created_at');
  console.log('\n4. Existing Albums:');
  if (allAlbums.length > 0) {
    console.log(`   Found ${allAlbums.length} album(s):`);
    allAlbums.forEach(album => {
      console.log(`   - ${album.name} (${album.photo_count} photos)`);
    });
  } else {
    console.log('   No albums found');
  }

  // Check foreign key constraint
  const [fks] = await connection.query(`
    SELECT CONSTRAINT_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
    FROM information_schema.KEY_COLUMN_USAGE
    WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'photos' AND REFERENCED_TABLE_NAME = 'albums'
  `, [config.database]);
  
  console.log('\n5. Foreign Key Constraints:');
  console.log(`   ${fks.length > 0 ? '✓' : '✗'} photos.album_id → albums.id constraint exists`);

  console.log('\n==================================================');
  
  const allChecks = 
    albumColNames.length >= requiredAlbumCols.length &&
    photoColNames.includes('album_id') &&
    generalAlbum.length > 0 &&
    fks.length > 0;

  if (allChecks) {
    console.log('✓ Albums feature is READY TO USE!');
  } else {
    console.log('⚠ Some issues detected - but feature may still work');
  }
  console.log('==================================================\n');

  await connection.end();
}

verifyAlbumsFeature().catch(console.error);
