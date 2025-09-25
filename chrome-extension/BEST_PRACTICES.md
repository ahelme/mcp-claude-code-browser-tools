# Chrome Extension Best Practices

## Performance Optimizations

### Memory Management
- **Implement listener pools** with maximum limits (5 concurrent)
- **Use DocumentFragment** for batch DOM operations (10+ elements)
- **Enforce log size limits** (500 max, cleanup at 400)
- **Monitor memory baselines** and trigger cleanup at 80% utilization

### Concurrency & Race Conditions
- **Use thread-safe configuration** for timeout settings
- **Implement operation locking** for exclusive access
- **Validate state before modifications** to prevent inconsistency
- **Reset state in finally blocks** with proper cleanup

### Script Execution
- **Provide CSP-safe fallbacks** with multiple execution methods
- **Cache working methods** to avoid repeated failures
- **Handle CSP violations gracefully** with meaningful error messages
- **Implement timeout and retry logic** for script execution

## Code Organization

### Modular Architecture
- **Extract utilities to separate modules** (url-validator.js, memory-manager.js)
- **Centralize constants** in dedicated configuration files
- **Separate concerns** - navigation logic vs validation vs memory management
- **Use dependency injection** with fallback implementations

### Error Handling
- **Define error message templates** in constants
- **Implement structured error responses** with codes and context
- **Provide actionable error messages** with recovery suggestions
- **Log errors with appropriate severity levels**

## Resource Management

### Event Listeners
- **Track all listeners** with unique IDs and metadata
- **Implement automatic cleanup** based on age and usage patterns
- **Use wrapper functions** for usage analytics
- **Enforce cleanup timeouts** (5min max age, 1min inactivity)

### Dynamic Cleanup
- **Adjust cleanup frequency** based on system load
- **Implement stale resource detection** with configurable thresholds
- **Use load-based intervals** (60s idle → 5s heavy load)
- **Provide manual cleanup triggers** for emergency situations

## Documentation & Maintenance

### JSDoc Standards
- **Include usage examples** for all public methods
- **Document parameter constraints** and validation rules
- **Specify return object structures** with property details
- **Add cross-references** to related methods and concepts

### Configuration Management
- **Use typed constants** instead of magic numbers
- **Group related settings** in configuration objects
- **Provide sensible defaults** with override capability
- **Document configuration dependencies** and constraints

## Testing & Validation

### Comprehensive Testing
- **Test concurrent operations** beyond system limits
- **Validate memory leak prevention** with stress cycles
- **Test CSP compliance** with multiple execution methods
- **Implement performance benchmarks** with threshold validation

### Error Recovery
- **Test all failure scenarios** including CSP violations
- **Validate cleanup effectiveness** after resource exhaustion
- **Test race condition prevention** under concurrent access
- **Verify thread-safety** of configuration changes