#!/usr/bin/env node

/**
 * Attribution Engine Test Suite
 * UnMoGrowP Attribution Platform - Core Algorithm Testing
 *
 * Tests all 5 attribution models with comprehensive scenarios:
 * 1. First Touch - 100% credit to first touchpoint
 * 2. Last Touch - 100% credit to last touchpoint
 * 3. Linear - Equal credit across all touchpoints
 * 4. Time Decay - Exponential decay favoring recent
 * 5. Position Based - 40% first, 40% last, 20% middle
 */

console.log('🎯 Attribution Engine Test Suite');
console.log('=================================\n');

// Test results tracking
let testResults = {
  passed: 0,
  failed: 0,
  total: 0
};

// Test assertion helper
function assert(condition, testName, expected, actual, tolerance = 0.0001) {
  testResults.total++;

  if (typeof expected === 'number' && typeof actual === 'number') {
    condition = Math.abs(expected - actual) <= tolerance;
  }

  if (condition) {
    testResults.passed++;
    console.log(`✅ ${testName}`);
  } else {
    testResults.failed++;
    console.log(`❌ ${testName}`);
    console.log(`   Expected: ${expected}`);
    console.log(`   Actual: ${actual}\n`);
  }
}

// Mock Attribution Engine (simplified version for testing)
class TestAttributionEngine {
  constructor(timeDecayHalfLife = 7 * 24 * 60 * 60 * 1000) {
    this.timeDecayHalfLife = timeDecayHalfLife;
  }

  calculateAttribution(touchpoints, conversion) {
    if (touchpoints.length === 0) {
      throw new Error('No touchpoints provided');
    }

    const sortedTouchpoints = [...touchpoints].sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
    );

    const attributionMap = new Map();

    sortedTouchpoints.forEach((touchpoint, index) => {
      const weights = {
        first_touch: this.calculateFirstTouchWeight(index, sortedTouchpoints.length),
        last_touch: this.calculateLastTouchWeight(index, sortedTouchpoints.length),
        linear: this.calculateLinearWeight(sortedTouchpoints.length),
        time_decay: this.calculateTimeDecayWeight(
          touchpoint.timestamp,
          conversion.timestamp,
          sortedTouchpoints
        ),
        position_based: this.calculatePositionBasedWeight(index, sortedTouchpoints.length)
      };

      attributionMap.set(touchpoint.id, weights);
    });

    this.validateWeights(attributionMap);
    return attributionMap;
  }

  calculateFirstTouchWeight(index, totalTouchpoints) {
    return index === 0 ? 1.0 : 0.0;
  }

  calculateLastTouchWeight(index, totalTouchpoints) {
    return index === totalTouchpoints - 1 ? 1.0 : 0.0;
  }

  calculateLinearWeight(totalTouchpoints) {
    return 1.0 / totalTouchpoints;
  }

  calculateTimeDecayWeight(touchpointTime, conversionTime, allTouchpoints) {
    const timeDiff = conversionTime.getTime() - touchpointTime.getTime();
    const decayFactor = Math.exp(-timeDiff / this.timeDecayHalfLife);

    const totalDecayFactor = allTouchpoints.reduce((sum, tp) => {
      const tpTimeDiff = conversionTime.getTime() - tp.timestamp.getTime();
      return sum + Math.exp(-tpTimeDiff / this.timeDecayHalfLife);
    }, 0);

    return decayFactor / totalDecayFactor;
  }

  calculatePositionBasedWeight(index, totalTouchpoints) {
    if (totalTouchpoints === 1) return 1.0;
    if (totalTouchpoints === 2) return 0.5;

    if (index === 0) return 0.4;
    if (index === totalTouchpoints - 1) return 0.4;

    const middleTouchpoints = totalTouchpoints - 2;
    return 0.2 / middleTouchpoints;
  }

  validateWeights(attributionMap) {
    const sums = {
      first_touch: 0,
      last_touch: 0,
      linear: 0,
      time_decay: 0,
      position_based: 0
    };

    for (const weights of attributionMap.values()) {
      sums.first_touch += weights.first_touch;
      sums.last_touch += weights.last_touch;
      sums.linear += weights.linear;
      sums.time_decay += weights.time_decay;
      sums.position_based += weights.position_based;
    }

    Object.entries(sums).forEach(([model, sum]) => {
      if (Math.abs(sum - 1.0) > 0.0001) {
        throw new Error(`Attribution weights for ${model} model sum to ${sum}, expected 1.0`);
      }
    });
  }
}

// Test data factory
function createTouchpoint(id, timestamp, source = 'google') {
  return {
    id,
    timestamp: new Date(timestamp),
    source,
    medium: 'cpc',
    campaign: 'test_campaign',
    position: 1
  };
}

function createConversion(timestamp, revenue = 100) {
  return {
    id: 'conv_1',
    timestamp: new Date(timestamp),
    event_type: 'purchase',
    revenue,
    organization_id: 'org_1',
    app_id: 'app_1',
    user_id: 'user_1',
    device_id: 'device_1'
  };
}

// Test 1: Single Touchpoint - All Models Should Give 100%
async function testSingleTouchpoint() {
  console.log('🎯 Testing Single Touchpoint Attribution');

  const engine = new TestAttributionEngine();
  const touchpoints = [createTouchpoint('tp1', '2025-01-01T10:00:00Z')];
  const conversion = createConversion('2025-01-01T11:00:00Z');

  const result = engine.calculateAttribution(touchpoints, conversion);
  const weights = result.get('tp1');

  assert(weights.first_touch === 1.0, 'Single touchpoint - First Touch = 100%', 1.0, weights.first_touch);
  assert(weights.last_touch === 1.0, 'Single touchpoint - Last Touch = 100%', 1.0, weights.last_touch);
  assert(weights.linear === 1.0, 'Single touchpoint - Linear = 100%', 1.0, weights.linear);
  assert(weights.time_decay === 1.0, 'Single touchpoint - Time Decay = 100%', 1.0, weights.time_decay);
  assert(weights.position_based === 1.0, 'Single touchpoint - Position Based = 100%', 1.0, weights.position_based);

  console.log('');
}

// Test 2: Two Touchpoints
async function testTwoTouchpoints() {
  console.log('🎯 Testing Two Touchpoints Attribution');

  const engine = new TestAttributionEngine();
  const touchpoints = [
    createTouchpoint('tp1', '2025-01-01T10:00:00Z', 'facebook'),
    createTouchpoint('tp2', '2025-01-01T12:00:00Z', 'google')
  ];
  const conversion = createConversion('2025-01-01T13:00:00Z');

  const result = engine.calculateAttribution(touchpoints, conversion);
  const weights1 = result.get('tp1');
  const weights2 = result.get('tp2');

  // First Touch - 100% to first touchpoint
  assert(weights1.first_touch === 1.0, 'Two touchpoints - First Touch: TP1 = 100%', 1.0, weights1.first_touch);
  assert(weights2.first_touch === 0.0, 'Two touchpoints - First Touch: TP2 = 0%', 0.0, weights2.first_touch);

  // Last Touch - 100% to last touchpoint
  assert(weights1.last_touch === 0.0, 'Two touchpoints - Last Touch: TP1 = 0%', 0.0, weights1.last_touch);
  assert(weights2.last_touch === 1.0, 'Two touchpoints - Last Touch: TP2 = 100%', 1.0, weights2.last_touch);

  // Linear - 50% each
  assert(weights1.linear === 0.5, 'Two touchpoints - Linear: TP1 = 50%', 0.5, weights1.linear);
  assert(weights2.linear === 0.5, 'Two touchpoints - Linear: TP2 = 50%', 0.5, weights2.linear);

  // Position Based - 50% each for 2 touchpoints
  assert(weights1.position_based === 0.5, 'Two touchpoints - Position Based: TP1 = 50%', 0.5, weights1.position_based);
  assert(weights2.position_based === 0.5, 'Two touchpoints - Position Based: TP2 = 50%', 0.5, weights2.position_based);

  // Time Decay - Recent should have more weight
  assert(weights2.time_decay > weights1.time_decay, 'Two touchpoints - Time Decay: TP2 > TP1', 'TP2 > TP1', `${weights2.time_decay} > ${weights1.time_decay}`);

  console.log('');
}

// Test 3: Five Touchpoints - Complex Scenario
async function testFiveTouchpoints() {
  console.log('🎯 Testing Five Touchpoints Attribution');

  const engine = new TestAttributionEngine();
  const touchpoints = [
    createTouchpoint('tp1', '2025-01-01T08:00:00Z', 'facebook'),
    createTouchpoint('tp2', '2025-01-01T10:00:00Z', 'google'),
    createTouchpoint('tp3', '2025-01-01T12:00:00Z', 'tiktok'),
    createTouchpoint('tp4', '2025-01-01T14:00:00Z', 'youtube'),
    createTouchpoint('tp5', '2025-01-01T16:00:00Z', 'instagram')
  ];
  const conversion = createConversion('2025-01-01T17:00:00Z');

  const result = engine.calculateAttribution(touchpoints, conversion);

  // First Touch - Only first touchpoint gets credit
  assert(result.get('tp1').first_touch === 1.0, 'Five touchpoints - First Touch: TP1 = 100%', 1.0, result.get('tp1').first_touch);
  assert(result.get('tp2').first_touch === 0.0, 'Five touchpoints - First Touch: TP2 = 0%', 0.0, result.get('tp2').first_touch);
  assert(result.get('tp5').first_touch === 0.0, 'Five touchpoints - First Touch: TP5 = 0%', 0.0, result.get('tp5').first_touch);

  // Last Touch - Only last touchpoint gets credit
  assert(result.get('tp1').last_touch === 0.0, 'Five touchpoints - Last Touch: TP1 = 0%', 0.0, result.get('tp1').last_touch);
  assert(result.get('tp5').last_touch === 1.0, 'Five touchpoints - Last Touch: TP5 = 100%', 1.0, result.get('tp5').last_touch);

  // Linear - Each gets 20%
  touchpoints.forEach((tp, index) => {
    const weight = result.get(tp.id).linear;
    assert(weight === 0.2, `Five touchpoints - Linear: TP${index + 1} = 20%`, 0.2, weight);
  });

  // Position Based - 40% first, 40% last, 20% middle (6.67% each middle)
  assert(result.get('tp1').position_based === 0.4, 'Five touchpoints - Position Based: TP1 = 40%', 0.4, result.get('tp1').position_based);
  assert(result.get('tp5').position_based === 0.4, 'Five touchpoints - Position Based: TP5 = 40%', 0.4, result.get('tp5').position_based);

  const middleWeight = result.get('tp2').position_based;
  assert(Math.abs(middleWeight - 0.2/3) < 0.001, 'Five touchpoints - Position Based: TP2 = 6.67%', 0.2/3, middleWeight);

  // Time Decay - Later touchpoints should have higher weights
  const timeDecayWeights = touchpoints.map(tp => result.get(tp.id).time_decay);
  assert(timeDecayWeights[4] > timeDecayWeights[0], 'Five touchpoints - Time Decay: TP5 > TP1', 'TP5 > TP1', `${timeDecayWeights[4]} > ${timeDecayWeights[0]}`);

  console.log('');
}

// Test 4: Edge Cases
async function testEdgeCases() {
  console.log('🎯 Testing Edge Cases');

  const engine = new TestAttributionEngine();

  // Test empty touchpoints
  try {
    engine.calculateAttribution([], createConversion('2025-01-01T10:00:00Z'));
    assert(false, 'Empty touchpoints should throw error', 'Error thrown', 'No error');
  } catch (error) {
    assert(true, 'Empty touchpoints throws error', 'Error thrown', 'Error thrown');
  }

  // Test touchpoints with same timestamp
  const sameTouchpoints = [
    createTouchpoint('tp1', '2025-01-01T10:00:00Z'),
    createTouchpoint('tp2', '2025-01-01T10:00:00Z')
  ];
  const sameResult = engine.calculateAttribution(sameTouchpoints, createConversion('2025-01-01T11:00:00Z'));

  // Should still work with same timestamps
  assert(sameResult.size === 2, 'Same timestamp touchpoints processed', 2, sameResult.size);

  // Test very long time decay (should heavily favor last touchpoint)
  const longTouchpoints = [
    createTouchpoint('tp1', '2025-01-01T10:00:00Z'),
    createTouchpoint('tp2', '2025-01-15T10:00:00Z') // 14 days later
  ];
  const longResult = engine.calculateAttribution(longTouchpoints, createConversion('2025-01-15T11:00:00Z'));

  const longWeights1 = longResult.get('tp1');
  const longWeights2 = longResult.get('tp2');
  assert(longWeights2.time_decay > 0.9, 'Long time decay heavily favors recent', '> 0.9', longWeights2.time_decay);

  console.log('');
}

// Test 5: Revenue Attribution
async function testRevenueAttribution() {
  console.log('🎯 Testing Revenue Attribution');

  const engine = new TestAttributionEngine();
  const touchpoints = [
    createTouchpoint('tp1', '2025-01-01T10:00:00Z'),
    createTouchpoint('tp2', '2025-01-01T12:00:00Z')
  ];
  const conversion = createConversion('2025-01-01T13:00:00Z', 1000); // $1000 revenue

  const attributionMap = engine.calculateAttribution(touchpoints, conversion);

  // Mock revenue calculation
  const revenueMap = new Map();
  for (const [touchpointId, weights] of attributionMap.entries()) {
    revenueMap.set(touchpointId, {
      first_touch: 1000 * weights.first_touch,
      last_touch: 1000 * weights.last_touch,
      linear: 1000 * weights.linear,
      time_decay: 1000 * weights.time_decay,
      position_based: 1000 * weights.position_based
    });
  }

  const revenue1 = revenueMap.get('tp1');
  const revenue2 = revenueMap.get('tp2');

  // First Touch - All revenue to first touchpoint
  assert(revenue1.first_touch === 1000, 'Revenue attribution - First Touch: TP1 = $1000', 1000, revenue1.first_touch);
  assert(revenue2.first_touch === 0, 'Revenue attribution - First Touch: TP2 = $0', 0, revenue2.first_touch);

  // Linear - $500 each
  assert(revenue1.linear === 500, 'Revenue attribution - Linear: TP1 = $500', 500, revenue1.linear);
  assert(revenue2.linear === 500, 'Revenue attribution - Linear: TP2 = $500', 500, revenue2.linear);

  // Check total revenue adds up for each model
  const totalLinear = revenue1.linear + revenue2.linear;
  const totalFirstTouch = revenue1.first_touch + revenue2.first_touch;

  assert(totalLinear === 1000, 'Revenue attribution - Linear total = $1000', 1000, totalLinear);
  assert(totalFirstTouch === 1000, 'Revenue attribution - First Touch total = $1000', 1000, totalFirstTouch);

  console.log('');
}

// Test 6: Time Decay with Different Half-Lives
async function testTimeDecayHalfLife() {
  console.log('🎯 Testing Time Decay Half-Life Variations');

  // Standard 7-day half-life
  const standard = new TestAttributionEngine(7 * 24 * 60 * 60 * 1000);
  // Mobile-optimized 3-day half-life
  const mobile = new TestAttributionEngine(3 * 24 * 60 * 60 * 1000);

  const touchpoints = [
    createTouchpoint('tp1', '2025-01-01T10:00:00Z'),
    createTouchpoint('tp2', '2025-01-05T10:00:00Z') // 4 days later
  ];
  const conversion = createConversion('2025-01-05T11:00:00Z');

  const standardResult = standard.calculateAttribution(touchpoints, conversion);
  const mobileResult = mobile.calculateAttribution(touchpoints, conversion);

  const standardTP2 = standardResult.get('tp2').time_decay;
  const mobileTP2 = mobileResult.get('tp2').time_decay;

  // Mobile (shorter half-life) should give more weight to recent touchpoint
  assert(mobileTP2 > standardTP2, 'Shorter half-life gives more weight to recent', 'Mobile > Standard', `${mobileTP2} > ${standardTP2}`);

  console.log(`   Standard (7-day): TP2 = ${(standardTP2 * 100).toFixed(1)}%`);
  console.log(`   Mobile (3-day): TP2 = ${(mobileTP2 * 100).toFixed(1)}%`);
  console.log('');
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting Attribution Engine Tests...\n');

  try {
    await testSingleTouchpoint();
    await testTwoTouchpoints();
    await testFiveTouchpoints();
    await testEdgeCases();
    await testRevenueAttribution();
    await testTimeDecayHalfLife();

    // Print results
    console.log('=================================');
    console.log('🎯 ATTRIBUTION ENGINE TEST RESULTS');
    console.log('=================================');
    console.log(`✅ Tests Passed: ${testResults.passed}`);
    console.log(`❌ Tests Failed: ${testResults.failed}`);
    console.log(`📊 Total Tests: ${testResults.total}`);
    console.log(`📈 Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);

    if (testResults.failed === 0) {
      console.log('\n🎉 ALL TESTS PASSED! Attribution algorithms working correctly!');
      console.log('📊 All 5 models (First Touch, Last Touch, Linear, Time Decay, Position-Based)');
      console.log('✅ Weight validation ensures all models sum to 100%');
      console.log('💰 Revenue attribution correctly distributes conversion value');
    } else {
      console.log('\n⚠️ Some tests failed. Attribution algorithms need review.');
    }

  } catch (error) {
    console.error('💥 Test suite failed with error:', error.message);
  }
}

// Run the test suite
runAllTests();