import path from 'node:path'
import { defineConfig } from 'prisma/config'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations'
  },
  datasource: {
    // Used by `prisma migrate diff --from-local-d1` and Prisma Studio.
    // The actual runtime database is the D1 binding (see wrangler.toml).
    url: `file:${path.join(__dirname, 'prisma', 'dev.sqlite')}`
  }
})
