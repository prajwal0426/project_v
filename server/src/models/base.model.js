import { query } from '../config/db.js';

export async function findById(table, id) {
  const { rows } = await query(`select * from ${table} where id = $1`, [id]);
  return rows[0] || null;
}

export async function list(table, limit = 50) {
  const { rows } = await query(`select * from ${table} order by created_at desc limit $1`, [limit]);
  return rows;
}
