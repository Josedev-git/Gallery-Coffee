import 'dotenv/config';
import {createClient} from '@supabase/supabase-js';
import {readFileSync} from 'node:fs';
if(!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) throw Error('Configure .env');
const db=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
const seed=JSON.parse(readFileSync(new URL('./seed.json',import.meta.url)));
for(const [table,rows] of [['collections',seed.collections],['products',seed.products]]){
 const {error}=await db.from(table).upsert(rows); if(error)throw error; console.log(`${table}: ${rows.length} registros`);
}
