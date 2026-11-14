# Applications

User-facing applications in this monorepo.

## Structure

- **web-ui/**: Svelte 5 frontend application (port 5173)
- **api-gateway/**: Bun + Hono API gateway (port 3001)

## Development

Each app can be developed independently:

```bash
# Start web UI
cd apps/web-ui && npm run dev

# Start API gateway
cd apps/api-gateway && bun run dev
```