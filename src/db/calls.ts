import { sql } from './client';

export async function createCallLog(createdAt: string) {
  const [call] = await sql.CreateCallLog`
    /* @notNull id created_at */
    insert into "call_log" ("created_at")
    values (${createdAt})
    returning "id", "created_at"
  `;
  if (!call) {
    throw new Error('Call log insert did not return a row');
  }
  return call;
}

export async function listCallLogs() {
  return await sql.ListCallLogs`
    select "id", "created_at"
    from "call_log"
    order by "id" desc
  `;
}

export async function countCallLogs() {
  const [result] = await sql.CountCallLogs`
    /* @notNull count */
    select count(*) as "count"
    from "call_log"
  `;
  return result?.count ?? 0;
}
