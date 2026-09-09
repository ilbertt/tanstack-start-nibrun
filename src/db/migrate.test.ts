import { afterEach, beforeEach, expect, test } from 'bun:test';
import { runMigrations } from './migrate';

let sql: Bun.SQL;

beforeEach(() => {
  sql = new Bun.SQL({ adapter: 'sqlite', filename: ':memory:' });
});

afterEach(async () => {
  await sql.close();
});

test('applies migrations in filename order without reordering the input', async () => {
  const migrations = [
    { name: '0002_insert.sql', sql: 'insert into entries values (1)' },
    { name: '0001_create.sql', sql: 'create table entries (id integer)' },
  ];

  await runMigrations({ sql, migrations });

  expect(await sql.unsafe<Array<{ id: number }>>('select * from entries')).toEqual([{ id: 1 }]);
  expect(migrations.map(({ name }) => name)).toEqual(['0002_insert.sql', '0001_create.sql']);
});

test('initializes the application schema and skips applied migrations', async () => {
  const migrations = [
    {
      name: '0001_call_log.sql',
      sql: await Bun.file(new URL('./migrations/0001_call_log.sql', import.meta.url)).text(),
    },
  ];

  await runMigrations({ sql, migrations });
  await sql.unsafe('insert into call_log (created_at) values ($1)', ['2026-09-08T00:00:00.000Z']);
  const applied = await sql.unsafe<Array<{ name: string; applied_at: string }>>(
    'select * from __migrations',
  );
  await runMigrations({ sql, migrations });

  expect(
    await sql.unsafe<Array<{ name: string; applied_at: string }>>('select * from __migrations'),
  ).toEqual(applied);
  expect(
    await sql.unsafe<Array<{ id: number; created_at: string }>>('select * from call_log'),
  ).toEqual([{ id: 1, created_at: '2026-09-08T00:00:00.000Z' }]);
});

test('rolls back a failed migration and permits retrying it', async () => {
  await expect(
    runMigrations({
      sql,
      migrations: [
        {
          name: '0001_create.sql',
          sql: 'create table entries (id integer); insert into missing_table values (1);',
        },
      ],
    }),
  ).rejects.toThrow();

  expect(await sql.unsafe<Array<{ name: string }>>('select name from __migrations')).toEqual([]);
  expect(
    await sql.unsafe<Array<{ name: string }>>(
      "select name from sqlite_master where name = 'entries'",
    ),
  ).toEqual([]);

  await runMigrations({
    sql,
    migrations: [{ name: '0001_create.sql', sql: 'create table entries (id integer)' }],
  });
  expect(await sql.unsafe<Array<{ name: string }>>('select name from __migrations')).toEqual([
    { name: '0001_create.sql' },
  ]);
});
