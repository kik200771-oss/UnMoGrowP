// ClickHouse Client for UnMoGrowP Attribution Platform
// Real-time analytics queries for dashboard
// Date: 2025-10-21

// ClickHouse HTTP interface client (no external dependencies needed)
class ClickHouseClient {
  private baseUrl: string;
  private username: string;
  private password: string;

  constructor() {
    this.baseUrl = process.env.CLICKHOUSE_URL || 'http://localhost:8123';
    this.username = process.env.CLICKHOUSE_USER || 'default';
    this.password = process.env.CLICKHOUSE_PASSWORD || '';
  }

  // Execute query with ClickHouse HTTP interface
  async query<T = any>(sql: string): Promise<T[]> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'text/plain',
      };
      if (this.password) {
        headers['Authorization'] = `Basic ${btoa(`${this.username}:${this.password}`)}`;
      }

      const fullQuery = `${sql} FORMAT JSONEachRow`;

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers,
        body: fullQuery,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`ClickHouse query failed: ${response.status} ${errorText}`);
      }

      const text = await response.text();

      // Parse JSONEachRow format (one JSON object per line)
      if (!text.trim()) {
        return [];
      }

      return text
        .trim()
        .split('\n')
        .map(line => JSON.parse(line)) as T[];

    } catch (error) {
      console.error('ClickHouse query error:', error);
      throw new Error(`Database query failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get dashboard statistics
  async getDashboardStats(appId?: string): Promise<{
    totalEvents: number;
    activeUsers: number;
    revenue: number;
  }> {
    const whereClause = appId ? `WHERE app_id = '${appId}'` : '';

    const sql = `
      SELECT
        count() as totalEvents,
        uniq(user_id) as activeUsers,
        round(sum(revenue), 2) as revenue
      FROM events
      ${whereClause}
    `;

    const results = await this.query<{
      totalEvents: string;
      activeUsers: string;
      revenue: string;
    }>(sql);

    const result = results[0];
    if (!result) {
      return { totalEvents: 0, activeUsers: 0, revenue: 0 };
    }

    return {
      totalEvents: parseInt(result.totalEvents) || 0,
      activeUsers: parseInt(result.activeUsers) || 0,
      revenue: parseFloat(result.revenue) || 0,
    };
  }

  // Get chart data for different time periods
  async getChartData(chartType: string, range: string = '7d', appId?: string): Promise<{
    labels: string[];
    data: number[];
  }> {
    let sql: string;
    const whereClause = appId ? `AND app_id = '${appId}'` : '';

    // Determine time range
    const rangeMap: Record<string, string> = {
      '7d': '7 DAY',
      '30d': '30 DAY',
      '1h': '1 HOUR',
      '24h': '1 DAY',
    };
    const timeRange = rangeMap[range] || '7 DAY';

    switch (chartType) {
      case 'installs':
        sql = `
          SELECT
            toDate(event_timestamp) as date,
            count() as count
          FROM events
          WHERE event_type = 'install'
            AND event_timestamp >= now() - INTERVAL ${timeRange}
            ${whereClause}
          GROUP BY date
          ORDER BY date
        `;
        break;

      case 'revenue':
        sql = `
          SELECT
            toDate(event_timestamp) as date,
            round(sum(revenue), 2) as count
          FROM events
          WHERE event_type = 'purchase'
            AND event_timestamp >= now() - INTERVAL ${timeRange}
            ${whereClause}
          GROUP BY date
          ORDER BY date
        `;
        break;

      case 'events':
        sql = `
          SELECT
            toDate(event_timestamp) as date,
            count() as count
          FROM events
          WHERE event_timestamp >= now() - INTERVAL ${timeRange}
            ${whereClause}
          GROUP BY date
          ORDER BY date
        `;
        break;

      case 'users':
        sql = `
          SELECT
            toDate(event_timestamp) as date,
            uniq(user_id) as count
          FROM events
          WHERE event_timestamp >= now() - INTERVAL ${timeRange}
            ${whereClause}
          GROUP BY date
          ORDER BY date
        `;
        break;

      default:
        // Default to event counts
        sql = `
          SELECT
            toDate(event_timestamp) as date,
            count() as count
          FROM events
          WHERE event_timestamp >= now() - INTERVAL ${timeRange}
            ${whereClause}
          GROUP BY date
          ORDER BY date
        `;
        break;
    }

    const results = await this.query<{
      date: string;
      count: string;
    }>(sql);

    return {
      labels: results.map(row => row.date),
      data: results.map(row => parseFloat(row.count) || 0),
    };
  }

  // Get top sources by events
  async getTopSources(appId?: string, limit: number = 10): Promise<Array<{
    source: string;
    events: number;
    revenue: number;
  }>> {
    const whereClause = appId ? `WHERE app_id = '${appId}'` : '';

    const sql = `
      SELECT
        source,
        count() as events,
        round(sum(revenue), 2) as revenue
      FROM events
      ${whereClause}
      GROUP BY source
      ORDER BY events DESC
      LIMIT ${limit}
    `;

    const results = await this.query<{
      source: string;
      events: string;
      revenue: string;
    }>(sql);

    return results.map(row => ({
      source: row.source || 'unknown',
      events: parseInt(row.events) || 0,
      revenue: parseFloat(row.revenue) || 0,
    }));
  }

  // Get events breakdown by type
  async getEventTypeBreakdown(appId?: string): Promise<Array<{
    eventType: string;
    count: number;
    percentage: number;
  }>> {
    const whereClause = appId ? `WHERE app_id = '${appId}'` : '';

    const sql = `
      SELECT
        event_type as eventType,
        count() as count,
        round(count() * 100.0 / sum(count()) OVER (), 2) as percentage
      FROM events
      ${whereClause}
      GROUP BY event_type
      ORDER BY count DESC
    `;

    const results = await this.query<{
      eventType: string;
      count: string;
      percentage: string;
    }>(sql);

    return results.map(row => ({
      eventType: row.eventType,
      count: parseInt(row.count) || 0,
      percentage: parseFloat(row.percentage) || 0,
    }));
  }

  // Test connection
  async testConnection(): Promise<boolean> {
    try {
      const result = await this.query('SELECT 1 as test');
      return result.length > 0 && result[0].test === 1;
    } catch (error) {
      console.error('ClickHouse connection test failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const clickhouse = new ClickHouseClient();

// Export types for API usage
export interface DashboardStats {
  totalEvents: number;
  activeUsers: number;
  revenue: number;
}

export interface ChartData {
  labels: string[];
  data: number[];
}

export interface SourceData {
  source: string;
  events: number;
  revenue: number;
}

export interface EventTypeData {
  eventType: string;
  count: number;
  percentage: number;
}