import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { withTypes } from "@ilbertt/bun-sqlgen";
import type { Queries } from "./queries.gen";

const dataDir = process.env.NIBRUN_DATA_DIR ?? join(process.cwd(), "data");
const migrationsDir = join(process.cwd(), "src", "db", "migrations");
type EmbeddedFile = Blob & { name?: string };

await mkdir(dataDir, { recursive: true });

export const sql = withTypes<Queries>(
	new Bun.SQL({
		adapter: "sqlite",
		filename: join(dataDir, "calls.db"),
	}),
);

await sql.unsafe("PRAGMA journal_mode = WAL");
await runMigrations();

async function runMigrations() {
	await sql.unsafe(`
    create table if not exists "__migrations" (
      "name" text primary key,
      "applied_at" text not null
    )
  `);

	const applied = new Set(
		(
			(await sql.unsafe('select "name" from "__migrations"')) as Array<{
				name: string;
			}>
		).map((migration) => migration.name),
	);

	for (const migration of await migrations()) {
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

async function migrations(): Promise<Array<{ name: string; sql: string }>> {
	if (Bun.isStandaloneExecutable) {
		const embeddedMigrations = (Bun.embeddedFiles as EmbeddedFile[]).flatMap(
			(file) => {
				const name = file.name;
				return name?.startsWith("migrations/") && name.endsWith(".sql")
					? [{ file, name: name.slice("migrations/".length) }]
					: [];
			},
		);
		return await Promise.all(
			embeddedMigrations.map(async ({ file, name }) => ({
				name,
				sql: await file.text(),
			})),
		);
	}

	const files: Array<{ name: string; sql: string }> = [];
	for await (const name of new Bun.Glob("*.sql").scan({
		cwd: migrationsDir,
		onlyFiles: true,
	})) {
		files.push({ name, sql: await Bun.file(join(migrationsDir, name)).text() });
	}
	return files;
}
