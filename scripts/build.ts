import { mkdir, rm } from "node:fs/promises";
import { join } from "node:path";

const PROJECT_DIR = join(import.meta.dir, "..");
const DIST_DIR = join(PROJECT_DIR, "dist");
const BINARY = join(DIST_DIR, "app");
const SERVER_ENTRY = join(PROJECT_DIR, ".output", "server", "index.mjs");
const MIGRATIONS_DIR = join(PROJECT_DIR, "src", "db", "migrations");
const buildTarget = process.env.BUILD_TARGET || "bun-linux-x64";

const vite = Bun.spawn(["bun", "--bun", "vite", "build"], {
	cwd: PROJECT_DIR,
	stderr: "inherit",
	stdout: "inherit",
});

if ((await vite.exited) !== 0) {
	process.exit(1);
}

await rm(DIST_DIR, { force: true, recursive: true });
await mkdir(DIST_DIR, { recursive: true });

const result = await Bun.build({
	entrypoints: [SERVER_ENTRY],
	compile: {
		outfile: BINARY,
		assets: [MIGRATIONS_DIR],
		...(buildTarget === "host"
			? {}
			: { target: buildTarget as Bun.Build.CompileTarget }),
	},
	format: "esm",
});

if (!result.success) {
	console.error(...result.logs);
	process.exit(1);
}
