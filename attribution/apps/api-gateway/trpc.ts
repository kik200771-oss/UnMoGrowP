// tRPC setup for type-safe API
import { initTRPC } from '@trpc/server'
import { z } from 'zod'

// Initialize tRPC
const t = initTRPC.create()

// Export reusable router and procedure helpers
export const router = t.router
export const publicProcedure = t.procedure

// Example schemas using Zod
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  rememberMe: z.boolean().optional(),
  recaptchaToken: z.string(),
})

export const dashboardStatsSchema = z.object({
  period: z.enum(['today', '7d', '30d', '90d']).default('30d'),
})

// Define the tRPC router
export const appRouter = router({
  // Auth procedures
  auth: router({
    login: publicProcedure
      .input(loginSchema)
      .mutation(async ({ input }) => {
        // Mock login - replace with real auth
        return {
          success: true,
          user: {
            id: '1',
            email: input.email,
            name: 'Demo User',
          },
          token: 'mock-jwt-token-' + Date.now(),
        }
      }),

    logout: publicProcedure
      .mutation(async () => {
        return { success: true }
      }),

    me: publicProcedure
      .query(async () => {
        // Mock user data
        return {
          id: '1',
          email: 'demo@unmogrowp.com',
          name: 'Demo User',
          role: 'admin',
        }
      }),
  }),

  // Dashboard procedures
  dashboard: router({
    stats: publicProcedure
      .input(dashboardStatsSchema)
      .query(async ({ input }) => {
        // Mock dashboard stats
        return {
          period: input.period,
          totalRevenue: 125430.50,
          totalUsers: 1243,
          activeUsers: 892,
          conversionRate: 3.24,
          avgSessionDuration: 345, // seconds
          topEvents: [
            { name: 'page_view', count: 45623 },
            { name: 'button_click', count: 12453 },
            { name: 'form_submit', count: 3421 },
          ],
        }
      }),

    recentEvents: publicProcedure
      .input(z.object({
        limit: z.number().min(1).max(100).default(10),
      }))
      .query(async ({ input }) => {
        // Mock recent events
        const events = []
        for (let i = 0; i < input.limit; i++) {
          events.push({
            id: `evt_${i}`,
            type: ['page_view', 'click', 'conversion'][i % 3],
            timestamp: new Date(Date.now() - i * 60000).toISOString(),
            userId: `user_${Math.floor(Math.random() * 1000)}`,
            properties: {
              page: '/dashboard',
              referrer: 'organic',
            },
          })
        }
        return events
      }),
  }),

  // Attribution procedures
  attribution: router({
    models: publicProcedure
      .query(async () => {
        return [
          { id: '1', name: 'Last Click', active: true },
          { id: '2', name: 'First Click', active: false },
          { id: '3', name: 'Linear', active: true },
          { id: '4', name: 'Time Decay', active: true },
          { id: '5', name: 'ML-based', active: false },
        ]
      }),

    analyze: publicProcedure
      .input(z.object({
        userId: z.string(),
        modelId: z.string(),
        startDate: z.string().datetime(),
        endDate: z.string().datetime(),
      }))
      .query(async ({ input }) => {
        return {
          modelId: input.modelId,
          touchpoints: [
            { channel: 'organic', contribution: 45.2 },
            { channel: 'paid_search', contribution: 28.7 },
            { channel: 'social', contribution: 15.3 },
            { channel: 'email', contribution: 10.8 },
          ],
          totalConversions: 145,
          totalRevenue: 12450.50,
        }
      }),
  }),

  // Apps procedures
  apps: router({
    list: publicProcedure
      .query(async () => {
        return [
          {
            id: 'app1',
            name: 'iOS App',
            platform: 'ios',
            activeUsers: 5234,
            events: 123456,
          },
          {
            id: 'app2',
            name: 'Android App',
            platform: 'android',
            activeUsers: 8921,
            events: 234567,
          },
        ]
      }),

    create: publicProcedure
      .input(z.object({
        name: z.string().min(3),
        platform: z.enum(['ios', 'android', 'web']),
        packageId: z.string(),
      }))
      .mutation(async ({ input }) => {
        return {
          id: `app_${Date.now()}`,
          ...input,
          apiKey: `sk_${Math.random().toString(36).substring(7)}`,
          createdAt: new Date().toISOString(),
        }
      }),
  }),
})

// Export type router type signature for client
export type AppRouter = typeof appRouter
