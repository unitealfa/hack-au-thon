import db from './database/db.js';

const { userDb, fieldDb, sensorDb, readingDb } = db;

console.log('\n🔍 Verifying Database Seeding...\n');

const user = userDb.findByEmail('demo@agricoole.com');
if (user) {
  console.log('✅ User:', user.name, `(${user.email})`);
  console.log('   Farm:', user.farm_name);
  
  const fields = fieldDb.findByUserId(user.id);
  console.log('\n✅ Fields:', fields.length);
  
  if (fields[0]) {
    console.log('   -', fields[0].name, `(${fields[0].crop_type})`);
    
    const sensors = sensorDb.findByFieldId(fields[0].id);
    console.log('\n✅ Sensors:', sensors.length);
    sensors.forEach(s => {
      console.log(`   - ${s.sensor_name} (${s.unit})`);
    });
    
    const readings = readingDb.findLatestByField(fields[0].id);
    console.log('\n✅ Latest Readings:', readings.length);
    readings.forEach(r => {
      console.log(`   - ${r.sensor_name}: ${r.value}${r.unit} ${r.is_healthy ? '🟢' : '🔴'}`);
    });
  }
  
  console.log('\n🎉 Database is ready!\n');
} else {
  console.log('❌ No demo user found. Database might not be seeded.\n');
}
