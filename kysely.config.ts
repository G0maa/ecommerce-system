import { defineConfig } from 'kysely-ctl';
import { dialect } from './src/database.js';

export default defineConfig({
  dialect,
  migrations: {
    migrationFolder: 'migrations',
  },
});
