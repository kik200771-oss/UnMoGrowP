// tRPC client for type-safe API calls
import { createTRPCClient, httpBatchLink } from '@trpc/client'
import type { AppRouter } from '../../../api/index'

// Create tRPC client with type-safety
export const trpc = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: 'http://localhost:3001/trpc',
      // Optional: add auth headers
      headers() {
        const token = localStorage.getItem('auth_token')
        return token ? { authorization: `Bearer ${token}` } : {}
      },
    }),
  ],
})

// Example usage in Svelte components:
//
// <script lang="ts">
//   import { trpc } from '$lib/trpc'
//
//   // Query (GET)
//   const stats = await trpc.dashboard.stats.query({ period: '30d' })
//
//   // Mutation (POST)
//   const result = await trpc.auth.login.mutate({
//     email: 'user@example.com',
//     password: 'password123',
//     recaptchaToken: 'token',
//   })
// </script>
