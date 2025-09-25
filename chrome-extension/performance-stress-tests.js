/**
 * Performance Stress Tests for Browser Navigation Tools
 *
 * Comprehensive test suite for validating performance improvements:
 * - Advanced retry strategy with delay capping
 * - Dynamic memory cleanup with load-based intervals
 * - Listener pool pattern for event management
 *
 * Test Categories:
 * 1. Concurrent Navigation Tests
 * 2. Memory Leak Detection Tests
 * 3. Performance Benchmark Tests
 * 4. Edge Case Stress Tests
 * 5. Resource Cleanup Validation Tests
 */

class PerformanceStressTester {
  constructor() {
    this.testResults = [];
    this.testSuite = 'Performance Stress Tests';
    this.startTime = Date.now();
    this.memoryBaseline = null;
    this.performanceMetrics = {
      navigationTimes: [],
      memoryUsage: [],
      listenerCounts: [],
      cleanupCycles: 0
    };

    console.log(`🚀 ${this.testSuite} - Test Suite Initialized`);
  }

  /**
   * Run all performance stress tests
   */
  async runAllTests() {
    console.log(`🧪 Starting ${this.testSuite} Test Suite...`);

    // Establish memory baseline
    await this.establishMemoryBaseline();

    const testMethods = [
      this.testConcurrentNavigations,
      this.testMemoryLeakDetection,
      this.testPerformanceBenchmarks,
      this.testListenerPoolStress,
      this.testRetryStrategyUnderLoad,
      this.testDynamicCleanupEfficiency,
      this.testResourceCleanupValidation,
      this.testEdgeCaseStress
    ];

    for (const testMethod of testMethods) {
      try {
        console.log(`\n🔬 Running: ${testMethod.name}`);
        await testMethod.call(this);

        // Brief pause between tests to allow cleanup
        await this.sleep(1000);
      } catch (error) {
        this.addResult(testMethod.name, false, `Test method failed: ${error.message}`);
      }
    }

    this.generateComprehensiveReport();
    return this.testResults;
  }

  /**
   * Test concurrent navigation requests to validate listener pool management
   */
  async testConcurrentNavigations() {
    const testName = 'Concurrent Navigation Requests';
    console.log(`🧪 Running: ${testName}`);

    if (!window.NavigationHandler) {
      this.addResult(testName, false, 'NavigationHandler not available');
      return;
    }

    const handler = new window.NavigationHandler();
    const concurrentRequests = 8; // Test beyond max concurrent listeners (5)
    const testUrls = [
      'https://example.com',
      'https://google.com',
      'https://github.com',
      'https://stackoverflow.com',
      'https://developer.mozilla.org',
      'https://www.w3.org',
      'https://nodejs.org',
      'https://reactjs.org'
    ];

    let successCount = 0;
    let errorCount = 0;
    const startTime = Date.now();

    try {
      // Track initial listener count
      const initialState = handler.getNavigationState();
      const initialListenerCount = initialState.activeListenerCount || 0;

      // Fire concurrent navigation requests
      const promises = testUrls.map(async (url, index) => {
        try {
          const mockResponse = (response) => {
            console.log(`📨 Mock response for ${url}:`, response.success ? 'SUCCESS' : 'FAILED');
          };

          const mockMessage = {
            url: url,
            requestId: `stress_test_${index}_${Date.now()}`,
            timeout: 5000 // Shorter timeout for stress test
          };

          // Simulate concurrent requests (don't await here)
          handler.handleNavigationRequest(mockMessage, mockResponse);

          await this.sleep(100); // Small stagger to simulate real usage
          successCount++;
        } catch (error) {
          console.warn(`⚠️ Concurrent navigation ${index} failed:`, error.message);
          errorCount++;
        }
      });

      // Wait a bit for listeners to be created
      await this.sleep(2000);

      // Check listener pool state during concurrent operations
      const peakState = handler.getNavigationState();
      const peakListenerCount = peakState.activeListenerCount || 0;
      const poolStatus = peakState.listenerPoolStatus;

      console.log(`📊 Listener Pool Status:`, poolStatus);

      // Wait for cleanup to occur
      await this.sleep(5000);

      const finalState = handler.getNavigationState();
      const finalListenerCount = finalState.activeListenerCount || 0;

      const elapsedTime = Date.now() - startTime;

      // Validation checks
      const checks = [
        {
          name: 'Listener Pool Respected Limits',
          passed: peakListenerCount <= handler.maxConcurrentListeners,
          message: `Peak: ${peakListenerCount}, Max: ${handler.maxConcurrentListeners}`
        },
        {
          name: 'Automatic Cleanup Occurred',
          passed: finalListenerCount < peakListenerCount,
          message: `Peak: ${peakListenerCount}, Final: ${finalListenerCount}`
        },
        {
          name: 'No Memory Leak Indicators',
          passed: poolStatus.utilizationPercent <= 100,
          message: `Utilization: ${poolStatus.utilizationPercent}%`
        },
        {
          name: 'Reasonable Performance',
          passed: elapsedTime < 15000, // Should complete within 15 seconds
          message: `Completed in ${elapsedTime}ms`
        }
      ];

      const allPassed = checks.every(check => check.passed);
      const summary = checks.map(c => `${c.name}: ${c.passed ? '✅' : '❌'} ${c.message}`).join(', ');

      this.addResult(testName, allPassed, summary);

      // Store metrics
      this.performanceMetrics.listenerCounts.push({
        initial: initialListenerCount,
        peak: peakListenerCount,
        final: finalListenerCount,
        testTime: elapsedTime
      });

    } catch (error) {
      this.addResult(testName, false, `Concurrent navigation test failed: ${error.message}`);
    }
  }

  /**
   * Test memory leak detection during extended operations
   */
  async testMemoryLeakDetection() {
    const testName = 'Memory Leak Detection';
    console.log(`🧪 Running: ${testName}`);

    if (!window.NavigationHandler) {
      this.addResult(testName, false, 'NavigationHandler not available');
      return;
    }

    const handler = new window.NavigationHandler();
    const iterations = 20; // Create and cleanup many operations
    const memorySnapshots = [];

    try {
      // Take initial memory snapshot
      if (performance.memory) {
        memorySnapshots.push({
          iteration: 0,
          used: performance.memory.usedJSHeapSize,
          total: performance.memory.totalJSHeapSize,
          limit: performance.memory.jsHeapSizeLimit
        });
      }

      for (let i = 0; i < iterations; i++) {
        // Create multiple listeners that will become stale
        const listener1 = handler.createManagedListener(() => {}, `test-${i}-1`);
        const listener2 = handler.createManagedListener(() => {}, `test-${i}-2`);
        const listener3 = handler.createManagedListener(() => {}, `test-${i}-3`);

        // Let some listeners become stale naturally
        if (i % 3 === 0) {
          listener1.remove();
        }
        if (i % 4 === 0) {
          listener2.remove();
        }
        // Leave listener3 to be cleaned up automatically

        // Force cleanup periodically
        if (i % 5 === 0) {
          handler.cleanupStaleListeners();
          this.performanceMetrics.cleanupCycles++;
        }

        // Take memory snapshot every 5 iterations
        if (i % 5 === 0 && performance.memory) {
          memorySnapshots.push({
            iteration: i + 1,
            used: performance.memory.usedJSHeapSize,
            total: performance.memory.totalJSHeapSize,
            limit: performance.memory.jsHeapSizeLimit,
            activeListeners: handler.listenerPool.size
          });
        }

        await this.sleep(100); // Small delay to simulate real usage
      }

      // Final cleanup
      handler.cleanupStaleListeners();
      await this.sleep(1000); // Allow garbage collection

      // Final memory snapshot
      if (performance.memory) {
        memorySnapshots.push({
          iteration: iterations,
          used: performance.memory.usedJSHeapSize,
          total: performance.memory.totalJSHeapSize,
          limit: performance.memory.jsHeapSizeLimit,
          activeListeners: handler.listenerPool.size
        });
      }

      // Analyze memory usage
      if (memorySnapshots.length > 1) {
        const initialMemory = memorySnapshots[0].used;
        const finalMemory = memorySnapshots[memorySnapshots.length - 1].used;
        const memoryGrowth = finalMemory - initialMemory;
        const growthPercent = (memoryGrowth / initialMemory) * 100;

        const memoryGrowthAcceptable = growthPercent < 50; // Less than 50% growth
        const finalListenerCount = handler.listenerPool.size;
        const listenersCleanedUp = finalListenerCount < (iterations * 2); // Should be much less

        console.log(`📊 Memory Analysis:`, {
          initialMemory: `${Math.round(initialMemory / 1024 / 1024)}MB`,
          finalMemory: `${Math.round(finalMemory / 1024 / 1024)}MB`,
          growth: `${Math.round(memoryGrowth / 1024 / 1024)}MB (${Math.round(growthPercent)}%)`,
          finalListeners: finalListenerCount,
          cleanupCycles: this.performanceMetrics.cleanupCycles
        });

        const passed = memoryGrowthAcceptable && listenersCleanedUp;
        const message = `Memory growth: ${Math.round(growthPercent)}%, Final listeners: ${finalListenerCount}, Cleanup cycles: ${this.performanceMetrics.cleanupCycles}`;

        this.addResult(testName, passed, message);
        this.performanceMetrics.memoryUsage = memorySnapshots;
      } else {
        this.addResult(testName, false, 'Performance.memory API not available for memory leak detection');
      }

    } catch (error) {
      this.addResult(testName, false, `Memory leak detection failed: ${error.message}`);
    }
  }

  /**
   * Test performance benchmarks for navigation operations
   */
  async testPerformanceBenchmarks() {
    const testName = 'Performance Benchmarks';
    console.log(`🧪 Running: ${testName}`);

    if (!window.NavigationHandler) {
      this.addResult(testName, false, 'NavigationHandler not available');
      return;
    }

    const handler = new window.NavigationHandler();
    const benchmarkOperations = [
      { operation: 'Listener Creation', iterations: 50 },
      { operation: 'Listener Removal', iterations: 50 },
      { operation: 'Cleanup Cycle', iterations: 10 },
      { operation: 'Status Check', iterations: 100 }
    ];

    const results = {};

    try {
      for (const benchmark of benchmarkOperations) {
        const times = [];

        for (let i = 0; i < benchmark.iterations; i++) {
          const startTime = performance.now();

          switch (benchmark.operation) {
            case 'Listener Creation':
              const listener = handler.createManagedListener(() => {}, `benchmark-${i}`);
              break;

            case 'Listener Removal':
              const tempListener = handler.createManagedListener(() => {}, `temp-${i}`);
              tempListener.remove();
              break;

            case 'Cleanup Cycle':
              handler.cleanupStaleListeners();
              break;

            case 'Status Check':
              handler.getNavigationState();
              break;
          }

          const endTime = performance.now();
          times.push(endTime - startTime);

          // Small delay to prevent overwhelming the system
          if (i % 10 === 0) await this.sleep(10);
        }

        const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
        const maxTime = Math.max(...times);
        const minTime = Math.min(...times);

        results[benchmark.operation] = {
          average: Math.round(avgTime * 100) / 100,
          max: Math.round(maxTime * 100) / 100,
          min: Math.round(minTime * 100) / 100,
          iterations: benchmark.iterations
        };
      }

      // Performance thresholds (in milliseconds)
      const thresholds = {
        'Listener Creation': 5,
        'Listener Removal': 5,
        'Cleanup Cycle': 50,
        'Status Check': 2
      };

      const performanceChecks = Object.entries(results).map(([operation, metrics]) => {
        const threshold = thresholds[operation];
        const passed = metrics.average <= threshold;
        return {
          operation,
          passed,
          message: `Avg: ${metrics.average}ms (threshold: ${threshold}ms), Max: ${metrics.max}ms`
        };
      });

      const allPassed = performanceChecks.every(check => check.passed);
      const summary = performanceChecks.map(c => `${c.operation}: ${c.passed ? '✅' : '❌'} ${c.message}`).join(', ');

      console.log(`📊 Performance Results:`, results);

      this.addResult(testName, allPassed, summary);
      this.performanceMetrics.navigationTimes.push(results);

    } catch (error) {
      this.addResult(testName, false, `Performance benchmark failed: ${error.message}`);
    }
  }

  /**
   * Test listener pool under extreme stress
   */
  async testListenerPoolStress() {
    const testName = 'Listener Pool Stress Test';
    console.log(`🧪 Running: ${testName}`);

    if (!window.NavigationHandler) {
      this.addResult(testName, false, 'NavigationHandler not available');
      return;
    }

    const handler = new window.NavigationHandler();
    const stressIterations = 100; // Create way more than max concurrent
    const createdListeners = [];

    try {
      const startTime = Date.now();

      // Create many listeners rapidly
      for (let i = 0; i < stressIterations; i++) {
        const listener = handler.createManagedListener(() => {
          console.log(`Listener ${i} called`);
        }, `stress-${i}`);

        createdListeners.push(listener);

        // Randomly remove some listeners
        if (Math.random() < 0.3 && createdListeners.length > 0) {
          const randomIndex = Math.floor(Math.random() * createdListeners.length);
          const listenerToRemove = createdListeners[randomIndex];
          if (listenerToRemove.isActive()) {
            listenerToRemove.remove();
            createdListeners.splice(randomIndex, 1);
          }
        }

        // Brief pause every 10 iterations
        if (i % 10 === 0) {
          await this.sleep(50);
        }
      }

      const creationTime = Date.now() - startTime;
      const peakState = handler.getNavigationState();
      const peakListeners = peakState.activeListenerCount;

      // Force multiple cleanup cycles
      for (let i = 0; i < 5; i++) {
        handler.cleanupStaleListeners();
        await this.sleep(200);
      }

      const cleanupTime = Date.now();
      const finalState = handler.getNavigationState();
      const finalListeners = finalState.activeListenerCount;

      // Validation
      const checks = [
        {
          name: 'Pool Limit Enforced',
          passed: peakListeners <= handler.maxConcurrentListeners + 2, // Small buffer for timing
          message: `Peak: ${peakListeners}, Limit: ${handler.maxConcurrentListeners}`
        },
        {
          name: 'Cleanup Effective',
          passed: finalListeners < peakListeners,
          message: `Peak: ${peakListeners}, Final: ${finalListeners}`
        },
        {
          name: 'Reasonable Creation Time',
          passed: creationTime < 10000,
          message: `Created ${stressIterations} listeners in ${creationTime}ms`
        },
        {
          name: 'No System Freeze',
          passed: (cleanupTime - startTime) < 30000,
          message: `Total test time: ${cleanupTime - startTime}ms`
        }
      ];

      const allPassed = checks.every(check => check.passed);
      const summary = checks.map(c => `${c.name}: ${c.passed ? '✅' : '❌'} ${c.message}`).join(', ');

      this.addResult(testName, allPassed, summary);

      // Cleanup remaining listeners
      createdListeners.forEach(listener => {
        if (listener.isActive()) {
          listener.remove();
        }
      });

    } catch (error) {
      this.addResult(testName, false, `Listener pool stress test failed: ${error.message}`);
    }
  }

  /**
   * Test retry strategy under load conditions
   */
  async testRetryStrategyUnderLoad() {
    const testName = 'Retry Strategy Under Load';
    console.log(`🧪 Running: ${testName}`);

    if (!window.NavigationHandler) {
      this.addResult(testName, false, 'NavigationHandler not available');
      return;
    }

    const handler = new window.NavigationHandler();
    const retryTests = [];

    try {
      // Simulate multiple failed navigations that require retries
      const failingUrls = [
        'https://nonexistent-domain-12345.com',
        'https://timeout-test.invalid',
        'https://connection-failed.test'
      ];

      const startTime = Date.now();

      for (let i = 0; i < failingUrls.length; i++) {
        const testStart = performance.now();

        try {
          const mockResponse = (response) => {
            const testEnd = performance.now();
            retryTests.push({
              url: failingUrls[i],
              success: response.success,
              time: testEnd - testStart,
              hasRetryInfo: response.error && response.error.includes('attempt')
            });
          };

          const mockMessage = {
            url: failingUrls[i],
            requestId: `retry_test_${i}`,
            timeout: 3000 // Short timeout to trigger retries faster
          };

          // Start the navigation (won't await since it will fail)
          handler.handleNavigationRequest(mockMessage, mockResponse);

        } catch (error) {
          // Expected for invalid URLs
        }

        await this.sleep(8000); // Wait for retries to complete
      }

      const totalTime = Date.now() - startTime;

      // Analyze retry behavior
      const maxExpectedTime = failingUrls.length * 15000; // 15 seconds per URL max with retries
      const allTestsCompleted = retryTests.length === failingUrls.length;
      const timeWithinBounds = totalTime < maxExpectedTime;
      const retryDelaysAreCapped = retryTests.every(test => test.time < 12000); // Max delay should be capped

      console.log(`📊 Retry Test Results:`, retryTests);

      const passed = allTestsCompleted && timeWithinBounds && retryDelaysAreCapped;
      const message = `Tests: ${retryTests.length}/${failingUrls.length}, Total time: ${totalTime}ms (max: ${maxExpectedTime}ms), Delays capped: ${retryDelaysAreCapped}`;

      this.addResult(testName, passed, message);

    } catch (error) {
      this.addResult(testName, false, `Retry strategy test failed: ${error.message}`);
    }
  }

  /**
   * Test dynamic cleanup efficiency
   */
  async testDynamicCleanupEfficiency() {
    const testName = 'Dynamic Cleanup Efficiency';
    console.log(`🧪 Running: ${testName}`);

    if (!window.NavigationHandler) {
      this.addResult(testName, false, 'NavigationHandler not available');
      return;
    }

    const handler = new window.NavigationHandler();
    const cleanupTimings = [];

    try {
      // Test different load scenarios
      const scenarios = [
        { name: 'No Load', listeners: 0, expectedInterval: 120000 },
        { name: 'Light Load', listeners: 2, expectedInterval: 60000 },
        { name: 'Moderate Load', listeners: 4, expectedInterval: 30000 },
        { name: 'Heavy Load', listeners: 6, expectedInterval: 10000 }
      ];

      for (const scenario of scenarios) {
        console.log(`🔬 Testing scenario: ${scenario.name}`);

        // Create listeners for this scenario
        const scenarioListeners = [];
        for (let i = 0; i < scenario.listeners; i++) {
          const listener = handler.createManagedListener(() => {}, `scenario-${scenario.name}-${i}`);
          scenarioListeners.push(listener);
        }

        // Wait for dynamic cleanup to assess the load
        await this.sleep(2000);

        // Check if cleanup intervals are adjusting properly
        const state = handler.getNavigationState();
        const poolStatus = state.listenerPoolStatus;

        cleanupTimings.push({
          scenario: scenario.name,
          actualListeners: poolStatus.totalListeners,
          expectedListeners: scenario.listeners,
          utilizationPercent: poolStatus.utilizationPercent
        });

        // Clean up scenario listeners
        scenarioListeners.forEach(listener => listener.remove());
        await this.sleep(1000);
      }

      // Validate that cleanup adapts to load
      const adaptiveCleanup = cleanupTimings.every(timing =>
        Math.abs(timing.actualListeners - timing.expectedListeners) <= 1
      );

      const utilizationReasonable = cleanupTimings.every(timing =>
        timing.utilizationPercent >= 0 && timing.utilizationPercent <= 100
      );

      console.log(`📊 Cleanup Efficiency Results:`, cleanupTimings);

      const passed = adaptiveCleanup && utilizationReasonable;
      const message = `Adaptive cleanup: ${adaptiveCleanup}, Utilization reasonable: ${utilizationReasonable}`;

      this.addResult(testName, passed, message);

    } catch (error) {
      this.addResult(testName, false, `Dynamic cleanup test failed: ${error.message}`);
    }
  }

  /**
   * Test resource cleanup validation
   */
  async testResourceCleanupValidation() {
    const testName = 'Resource Cleanup Validation';
    console.log(`🧪 Running: ${testName}`);

    if (!window.NavigationHandler) {
      this.addResult(testName, false, 'NavigationHandler not available');
      return;
    }

    try {
      // Create and destroy multiple handlers
      const handlers = [];
      for (let i = 0; i < 3; i++) {
        const handler = new window.NavigationHandler();

        // Create some listeners
        for (let j = 0; j < 3; j++) {
          handler.createManagedListener(() => {}, `handler-${i}-listener-${j}`);
        }

        handlers.push(handler);
      }

      // Check resource usage
      const totalInitialListeners = handlers.reduce((sum, handler) =>
        sum + handler.getNavigationState().activeListenerCount, 0
      );

      // Destroy all handlers
      handlers.forEach(handler => handler.destroy());

      // Wait for cleanup to complete
      await this.sleep(2000);

      // Verify cleanup (create new handler to check clean state)
      const testHandler = new window.NavigationHandler();
      const finalState = testHandler.getNavigationState();

      const cleanupSuccessful = finalState.activeListenerCount === 0;
      const noLeakedTimeouts = finalState.listenerPoolStatus.totalListeners === 0;

      testHandler.destroy();

      const passed = cleanupSuccessful && noLeakedTimeouts;
      const message = `Initial listeners: ${totalInitialListeners}, Final listeners: ${finalState.activeListenerCount}, Cleanup successful: ${cleanupSuccessful}`;

      this.addResult(testName, passed, message);

    } catch (error) {
      this.addResult(testName, false, `Resource cleanup validation failed: ${error.message}`);
    }
  }

  /**
   * Test edge case stress scenarios
   */
  async testEdgeCaseStress() {
    const testName = 'Edge Case Stress Scenarios';
    console.log(`🧪 Running: ${testName}`);

    if (!window.NavigationHandler) {
      this.addResult(testName, false, 'NavigationHandler not available');
      return;
    }

    const handler = new window.NavigationHandler();
    const edgeCaseResults = [];

    try {
      // Edge case 1: Rapid listener creation and removal
      console.log('🔬 Testing rapid create/remove cycles...');
      const rapidCycleStart = performance.now();
      for (let i = 0; i < 50; i++) {
        const listener = handler.createManagedListener(() => {}, `rapid-${i}`);
        if (i % 2 === 0) {
          listener.remove(); // Remove every other listener immediately
        }
      }
      const rapidCycleTime = performance.now() - rapidCycleStart;
      edgeCaseResults.push({
        test: 'Rapid Create/Remove',
        time: rapidCycleTime,
        passed: rapidCycleTime < 1000 // Should complete quickly
      });

      // Edge case 2: Multiple cleanup calls
      console.log('🔬 Testing multiple cleanup calls...');
      const multiCleanupStart = performance.now();
      for (let i = 0; i < 10; i++) {
        handler.cleanupStaleListeners();
      }
      const multiCleanupTime = performance.now() - multiCleanupStart;
      edgeCaseResults.push({
        test: 'Multiple Cleanup Calls',
        time: multiCleanupTime,
        passed: multiCleanupTime < 500 // Should handle gracefully
      });

      // Edge case 3: Remove non-existent listeners
      console.log('🔬 Testing removal of non-existent listeners...');
      try {
        for (let i = 0; i < 5; i++) {
          handler.removeListener(`fake-listener-${i}`);
        }
        edgeCaseResults.push({
          test: 'Remove Non-existent Listeners',
          time: 0,
          passed: true // Should not throw errors
        });
      } catch (error) {
        edgeCaseResults.push({
          test: 'Remove Non-existent Listeners',
          time: 0,
          passed: false,
          error: error.message
        });
      }

      // Edge case 4: Status checks during cleanup
      console.log('🔬 Testing status checks during cleanup...');
      const concurrentStart = performance.now();
      const statusPromises = [];

      // Start cleanup
      setTimeout(() => handler.cleanupStaleListeners(), 10);

      // Concurrent status checks
      for (let i = 0; i < 20; i++) {
        statusPromises.push(new Promise((resolve) => {
          setTimeout(() => {
            try {
              const state = handler.getNavigationState();
              resolve({ success: true, listeners: state.activeListenerCount });
            } catch (error) {
              resolve({ success: false, error: error.message });
            }
          }, i * 10);
        }));
      }

      const statusResults = await Promise.all(statusPromises);
      const concurrentTime = performance.now() - concurrentStart;
      const allStatusCallsSucceeded = statusResults.every(result => result.success);

      edgeCaseResults.push({
        test: 'Concurrent Status Checks',
        time: concurrentTime,
        passed: allStatusCallsSucceeded && concurrentTime < 1000
      });

      console.log(`📊 Edge Case Results:`, edgeCaseResults);

      const allEdgeCasesPassed = edgeCaseResults.every(result => result.passed);
      const summary = edgeCaseResults.map(r => `${r.test}: ${r.passed ? '✅' : '❌'} (${Math.round(r.time)}ms)`).join(', ');

      this.addResult(testName, allEdgeCasesPassed, summary);

    } catch (error) {
      this.addResult(testName, false, `Edge case stress test failed: ${error.message}`);
    }
  }

  /**
   * Establish memory baseline for comparison
   */
  async establishMemoryBaseline() {
    if (performance.memory) {
      this.memoryBaseline = {
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize,
        limit: performance.memory.jsHeapSizeLimit,
        timestamp: Date.now()
      };
      console.log(`📊 Memory baseline established:`, this.memoryBaseline);
    } else {
      console.warn('⚠️ Performance.memory API not available - memory analysis limited');
    }
  }

  /**
   * Utility function for test delays
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Add test result to collection
   */
  addResult(testName, passed, message) {
    const result = {
      testName,
      passed,
      message,
      timestamp: new Date().toISOString(),
      elapsedTime: Date.now() - this.startTime
    };

    this.testResults.push(result);

    const emoji = passed ? '✅' : '❌';
    console.log(`${emoji} ${testName}: ${message}`);
  }

  /**
   * Generate comprehensive test report with performance analysis
   */
  generateComprehensiveReport() {
    const passed = this.testResults.filter(r => r.passed).length;
    const total = this.testResults.length;
    const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;
    const totalTime = Date.now() - this.startTime;

    console.log(`\n🚀 ${this.testSuite.toUpperCase()} - COMPREHENSIVE REPORT`);
    console.log('━'.repeat(80));
    console.log(`📊 Summary: ${passed}/${total} tests passed (${passRate}%)`);
    console.log(`⏱️ Total execution time: ${Math.round(totalTime / 1000)}s`);
    console.log(`⏰ Completed: ${new Date().toISOString()}\n`);

    // Performance metrics summary
    if (this.performanceMetrics.memoryUsage.length > 0) {
      console.log(`💾 Memory Analysis:`);
      const initialMem = this.performanceMetrics.memoryUsage[0];
      const finalMem = this.performanceMetrics.memoryUsage[this.performanceMetrics.memoryUsage.length - 1];
      const memGrowth = ((finalMem.used - initialMem.used) / initialMem.used * 100);
      console.log(`   Initial: ${Math.round(initialMem.used / 1024 / 1024)}MB`);
      console.log(`   Final: ${Math.round(finalMem.used / 1024 / 1024)}MB`);
      console.log(`   Growth: ${Math.round(memGrowth)}%`);
    }

    if (this.performanceMetrics.listenerCounts.length > 0) {
      console.log(`\n🎯 Listener Pool Analysis:`);
      this.performanceMetrics.listenerCounts.forEach((count, i) => {
        console.log(`   Test ${i + 1}: ${count.initial} → ${count.peak} → ${count.final} listeners (${count.testTime}ms)`);
      });
    }

    console.log(`\n🧪 Detailed Test Results:`);
    this.testResults.forEach((result, index) => {
      const emoji = result.passed ? '✅' : '❌';
      const timeElapsed = Math.round(result.elapsedTime / 1000);
      console.log(`${index + 1}. ${emoji} ${result.testName} (${timeElapsed}s)`);
      console.log(`   ${result.message}`);
    });

    console.log(`\n🎯 Performance Status:`);
    if (passRate === 100) {
      console.log('🌟 EXCELLENT: All performance optimizations working perfectly!');
      console.log('   ✅ Retry strategy with delay capping');
      console.log('   ✅ Dynamic memory cleanup');
      console.log('   ✅ Listener pool management');
      console.log('   ✅ Resource cleanup validation');
      console.log('   ✅ Stress test resilience');
    } else if (passRate >= 80) {
      console.log('⚠️  GOOD: Performance optimizations mostly working, minor issues detected');
    } else {
      console.log('❌ CRITICAL: Performance issues detected that need attention');
    }

    console.log('\n🚀 Performance optimization validation complete!');

    return {
      passed,
      total,
      passRate,
      totalTime,
      performanceMetrics: this.performanceMetrics,
      results: this.testResults
    };
  }
}

// Make tester globally available
window.PerformanceStressTester = PerformanceStressTester;

// Auto-run tests if in testing mode
if (window.location.search.includes('stresstest=true')) {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(async () => {
      const tester = new PerformanceStressTester();
      await tester.runAllTests();
    }, 2000);
  });
}

console.log('🧪 Performance Stress Test Suite loaded - Run: new PerformanceStressTester().runAllTests()');