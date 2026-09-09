import { mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';

const PROJECT_DIR = join(import.meta.dir, '..');
const DIST_DIR = join(PROJECT_DIR, 'dist');
const BINARY = join(DIST_DIR, 'app');
const SERVER_ENTRY = join(PROJECT_DIR, '.output', 'server', 'index.mjs');
const PUBLIC_DIR = join(PROJECT_DIR, '.output', 'public');
const MIGRATIONS_DIR = join(PROJECT_DIR, 'src', 'db', 'migrations');
const buildTarget = process.env.BUILD_TARGET || 'bun-linux-x64';

const vite = Bun.spawn(['bun', '--bun', 'vite', 'build'], {
  cwd: PROJECT_DIR,
  stderr: 'inherit',
  stdout: 'inherit',
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
    assets: [PUBLIC_DIR, MIGRATIONS_DIR],
    ...(buildTarget === 'host' ? {} : { target: buildTarget as Bun.Build.CompileTarget }),
  },
  format: 'esm',
  plugins: [
    {
      name: 'embed-nitro-public-assets',
      setup(build) {
        build.onLoad({ filter: /[\\/]\.output[\\/]server[\\/]index\.mjs$/ }, async (args) => {
          const source = await Bun.file(args.path).text();
          const embeddedAssets = source.replace(
            /function readAsset\(id\) \{\s*const serverDir = dirname\(fileURLToPath\(globalThis\.__nitro_main__\)\);\s*return promises\.readFile\(resolve\(serverDir, public_assets_data_default\[id\]\.path\)\);\s*\}/,
            `function readAsset(id) {
  const asset = Bun.embeddedFiles.find((file) => file.name === \`public\${id}\`);
  if (!asset) throw new Error(\`Embedded asset not found: \${id}\`);
  return asset.arrayBuffer();
}`,
          );

          if (embeddedAssets === source) {
            throw new Error("Nitro's public asset loader changed");
          }

          const nibrunHost = embeddedAssets.replace(
            'var host = process.env.NITRO_HOST || process.env.HOST;',
            'var host = process.env.NITRO_HOST || process.env.HOST || "0.0.0.0";',
          );

          if (nibrunHost === embeddedAssets) {
            throw new Error("Nitro's host initialization changed");
          }

          return { contents: nibrunHost, loader: 'js' };
        });
      },
    },
  ],
});

if (!result.success) {
  console.error(...result.logs);
  process.exit(1);
}
