export type Migration = { name: string; sql: string };

export async function runMigrations(options: {
  sql: Bun.SQL;
  migrations: ReadonlyArray<Migration>;
}) {
  const { sql, migrations } = options;

  await sql.unsafe(`
    create table if not exists "__migrations" (
      "name" text primary key,
      "applied_at" text not null
    )
  `);

  const applied = new Set(
    (await sql.unsafe<Array<{ name: string }>>('select "name" from "__migrations"')).map(
      (migration) => migration.name,
    ),
  );

  // Filesystem and embedded-file discovery do not guarantee version order.
  const ordered = [...migrations].sort(
    // biome-ignore lint/complexity/useMaxParams: a sort comparator takes two operands
    (a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0),
  );
  for (const migration of ordered) {
    if (applied.has(migration.name)) {
      continue;
    }

    await sql.begin(async (transaction) => {
      await transaction.unsafe(migration.sql);
      await transaction.unsafe(
        'insert into "__migrations" ("name", "applied_at") values ($1, $2)',
        [migration.name, new Date().toISOString()],
      );
    });
  }
}
