import Surreal from 'surrealdb.js';
import * as dotenv from 'dotenv';
dotenv.config();

async function main() {
  const db = new Surreal();
  await db.connect(process.env.SURREALDB_URL!);
  await db.signin({ 
    namespace: process.env.SURREALDB_NS!, 
    username: process.env.SURREALDB_USER!, 
    password: process.env.SURREALDB_PASS! 
  });
  await db.use({ namespace: process.env.SURREALDB_NS!, database: process.env.SURREALDB_DB! });
  
  const result = await db.query('SELECT * FROM conflict ORDER BY created_at DESC LIMIT 1');
  console.log(JSON.stringify(result, null, 2));
  await db.close();
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
