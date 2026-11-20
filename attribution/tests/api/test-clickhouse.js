#!/usr/bin/env node

// ClickHouse Integration Test
// UnMoGrowP Attribution Platform - Test real data connection

console.log('📊 ClickHouse Integration Test');
console.log('==============================\n');

import { clickhouse } from './clickhouse.ts';

async function testClickHouseConnection() {
  console.log('🔗 Testing ClickHouse connection...');

  try {
    const isConnected = await clickhouse.testConnection();

    if (isConnected) {
      console.log('✅ ClickHouse connection successful!');
      return true;
    } else {
      console.log('❌ ClickHouse connection failed - server not available');
      return false;
    }
  } catch (error) {
    console.log(`❌ ClickHouse connection failed: ${error.message}`);
    return false;
  }
}

async function testDashboardStats() {
  console.log('\n📈 Testing dashboard stats query...');

  try {
    const stats = await clickhouse.getDashboardStats();

    console.log('✅ Dashboard stats query successful:');
    console.log(`   Total Events: ${stats.totalEvents}`);
    console.log(`   Active Users: ${stats.activeUsers}`);
    console.log(`   Revenue: $${stats.revenue}`);

    return true;
  } catch (error) {
    console.log(`❌ Dashboard stats query failed: ${error.message}`);
    return false;
  }
}

async function testChartData() {
  console.log('\n📊 Testing chart data query...');

  try {
    const chartData = await clickhouse.getChartData('events', '7d');

    console.log('✅ Chart data query successful:');
    console.log(`   Labels: [${chartData.labels.join(', ')}]`);
    console.log(`   Data points: [${chartData.data.join(', ')}]`);

    return true;
  } catch (error) {
    console.log(`❌ Chart data query failed: ${error.message}`);
    return false;
  }
}

async function createTestData() {
  console.log('\n🎯 Creating test events in ClickHouse...');

  try {
    // Create events table if not exists
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS events (
        event_id String,
        event_type String,
        app_id String,
        user_id String,
        session_id String,
        event_timestamp DateTime,
        platform String,
        source String DEFAULT 'organic',
        revenue Float64 DEFAULT 0,
        event_data String DEFAULT '{}'
      ) ENGINE = MergeTree()
      ORDER BY event_timestamp
    `;

    await clickhouse.query(createTableSQL);
    console.log('✅ Events table created/verified');

    // Insert test data
    const testEvents = [];
    const now = new Date();

    for (let i = 0; i < 10; i++) {
      const eventDate = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000)); // Last 10 days
      testEvents.push({
        event_id: `test-event-${i}`,
        event_type: i % 3 === 0 ? 'install' : (i % 3 === 1 ? 'purchase' : 'app_open'),
        app_id: 'test-app-1',
        user_id: `user-${i % 5}`, // 5 unique users
        session_id: `session-${i}`,
        event_timestamp: eventDate.toISOString().slice(0, 19),
        platform: i % 2 === 0 ? 'android' : 'ios',
        source: ['organic', 'facebook', 'google'][i % 3],
        revenue: i % 3 === 1 ? (Math.random() * 50).toFixed(2) : 0
      });
    }

    // Insert events
    for (const event of testEvents) {
      const insertSQL = `
        INSERT INTO events VALUES (
          '${event.event_id}',
          '${event.event_type}',
          '${event.app_id}',
          '${event.user_id}',
          '${event.session_id}',
          '${event.event_timestamp}',
          '${event.platform}',
          '${event.source}',
          ${event.revenue},
          '{}'
        )
      `;

      await clickhouse.query(insertSQL);
    }

    console.log(`✅ Inserted ${testEvents.length} test events`);
    return true;

  } catch (error) {
    console.log(`❌ Failed to create test data: ${error.message}`);
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 Starting ClickHouse integration tests...\n');

  let results = {
    connection: false,
    dashboardStats: false,
    chartData: false,
    testData: false
  };

  // Test connection first
  results.connection = await testClickHouseConnection();

  if (results.connection) {
    // If connected, create test data first
    results.testData = await createTestData();

    // Then test data retrieval
    results.dashboardStats = await testDashboardStats();
    results.chartData = await testChartData();
  } else {
    console.log('\n⚠️  ClickHouse server not available. To test:');
    console.log('   1. Start Docker: docker-compose -f config/docker-compose.yml up -d');
    console.log('   2. Wait for ClickHouse to initialize');
    console.log('   3. Run this test again\n');
  }

  // Print results
  console.log('\n==============================');
  console.log('🎯 TEST RESULTS SUMMARY');
  console.log('==============================');
  console.log(`🔗 Connection: ${results.connection ? '✅ Pass' : '❌ Fail'}`);
  console.log(`🎯 Test Data: ${results.testData ? '✅ Pass' : '❌ Fail'}`);
  console.log(`📈 Dashboard: ${results.dashboardStats ? '✅ Pass' : '❌ Fail'}`);
  console.log(`📊 Charts: ${results.chartData ? '✅ Pass' : '❌ Fail'}`);

  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(r => r).length;

  console.log(`\n📊 Overall: ${passedTests}/${totalTests} tests passed`);

  if (passedTests === totalTests) {
    console.log('\n🎉 ALL TESTS PASSED! ClickHouse integration is working!');
    console.log('✅ Dashboard will now show real data instead of zeros');
  } else if (passedTests > 0) {
    console.log('\n⚠️  Some tests passed - partial ClickHouse functionality');
  } else {
    console.log('\n❌ All tests failed - ClickHouse integration not working');
  }
}

// Run tests
runAllTests().catch(console.error);