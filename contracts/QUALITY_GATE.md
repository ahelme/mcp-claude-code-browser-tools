# MANE Quality Gates

## Service Level Objectives (SLOs)

All agents must meet these quality gates before promotion to integration universe.

## Performance SLOs

### Response Time
- **P95 Latency**: < 2000ms for all browser tool operations
- **P99 Latency**: < 5000ms for all browser tool operations
- **Timeout Threshold**: 30 seconds (hard limit)

### Reliability
- **Error Rate**: < 2% for successful tool executions
- **Success Rate**: > 98% for all browser operations
- **Retry Success Rate**: > 90% after first retry

### Availability
- **Uptime**: > 99.5% during development sessions
- **Health Check**: Must respond within 500ms
- **Recovery Time**: < 30 seconds after failure

## Functional Quality Gates

### Contract Compliance
- **API Schema**: 100% compliance with `contracts/http.yaml`
- **Config Schema**: 100% compliance with `contracts/config.schema.json`
- **Interface Implementation**: All `IBrowserTool` methods implemented

### Test Coverage
- **Unit Tests**: > 80% code coverage
- **Integration Tests**: All happy path scenarios covered
- **E2E Tests**: Critical user journeys validated

### Code Quality
- **Linting**: Zero eslint/pylint violations
- **Type Safety**: 100% TypeScript/type hints coverage (where applicable)
- **Security**: No critical vulnerabilities (audit scan)

## Browser-Specific Quality Gates

### Tool-Specific SLOs

#### browser_navigate
- **Navigation Time**: < 3000ms for standard pages
- **Success Rate**: > 99% for valid URLs
- **Error Handling**: Graceful failure for invalid URLs

#### browser_screenshot
- **Capture Time**: < 2000ms for full page
- **File Size**: < 2MB for standard screenshots
- **Format**: PNG with proper metadata

#### browser_click
- **Click Execution**: < 500ms response time
- **Element Detection**: 100% success for visible elements
- **Error Messages**: Clear feedback for missing elements

#### browser_type
- **Typing Speed**: < 100ms per character
- **Input Validation**: Proper handling of special characters
- **Clear Function**: Reliable field clearing before typing

#### browser_evaluate
- **Script Execution**: < 5000ms for standard scripts
- **Security**: No XSS vulnerabilities
- **Error Handling**: Safe script failure containment

#### browser_get_content
- **Content Retrieval**: < 3000ms for standard pages
- **Format Options**: Both HTML and text formats working
- **Selector Support**: CSS selectors properly implemented

#### browser_audit
- **Audit Completion**: < 30000ms for full audit
- **Report Format**: Valid JSON lighthouse format
- **Categories**: All audit categories functional

#### browser_wait
- **Element Detection**: < configured timeout
- **Polling Interval**: 100ms maximum
- **Timeout Handling**: Clean timeout error messages

#### browser_get_console
- **Log Retrieval**: < 1000ms for console logs
- **Filtering**: All log levels properly filtered
- **Format**: Structured log output

## Quality Validation Commands

### Automated Checks
```bash
# Contract validation
make contract-check

# Environment validation
make env-validate

# Test suite
make test-all

# Performance benchmarks
make benchmark

# Security scan
make security-audit
```

### Quality Gate Pipeline
```bash
# Full quality gate check
make quality-gate

# Individual checks
make lint
make type-check
make unit-test
make integration-test
make e2e-test
make performance-test
```

## Promotion Checklist

Before promoting agent work to integration universe:

### 📋 Pre-Promotion Checklist

- [ ] **Contract Compliance**
  - [ ] OpenAPI diff shows no breaking changes
  - [ ] Config schema validation passes
  - [ ] All interface contracts implemented

- [ ] **Tests & Quality**
  - [ ] All tests pass (unit, integration, e2e)
  - [ ] Code coverage > 80%
  - [ ] Linting passes with zero violations
  - [ ] Security scan shows no critical issues

- [ ] **Performance SLOs**
  - [ ] P95 latency < 2000ms
  - [ ] Error rate < 2%
  - [ ] All tool-specific SLOs met

- [ ] **Functional Validation**
  - [ ] Happy path user journey works end-to-end
  - [ ] Error scenarios handled gracefully
  - [ ] Chrome extension integration functional

- [ ] **Documentation**
  - [ ] API changes documented
  - [ ] README updated if needed
  - [ ] Breaking changes clearly marked

### 🚨 Blocking Issues

Work CANNOT be promoted if any of these conditions exist:

- ❌ Critical test failures
- ❌ P95 latency > 5000ms
- ❌ Error rate > 5%
- ❌ Contract violations
- ❌ Security vulnerabilities (high/critical)
- ❌ Chrome extension cannot connect
- ❌ Core browser tools non-functional

## Monitoring & Alerting

### Real-time Metrics
- Response time percentiles (P50, P95, P99)
- Error rates by tool and error type
- Success rates and retry patterns
- Resource utilization (memory, CPU)

### Alert Thresholds
- **Warning**: P95 > 1500ms or error rate > 1%
- **Critical**: P95 > 3000ms or error rate > 3%
- **Emergency**: Any tool completely non-functional

### Dashboard Requirements
- Real-time tool performance metrics
- Historical trend analysis
- Agent-specific quality gate status
- Integration pipeline health

## Quality Gate Automation

### Pre-commit Hooks
```bash
#!/bin/bash
# .git/hooks/pre-commit
make contract-check || exit 1
make env-validate || exit 1
make lint || exit 1
make type-check || exit 1
```

### CI/CD Pipeline
```yaml
quality_gates:
  stage: test
  script:
    - make quality-gate
  artifacts:
    reports:
      junit: test-results.xml
      coverage: coverage.xml
    paths:
      - performance-report.json
  only:
    - merge_requests
    - universe-integration
```

## Continuous Improvement

### Quality Metrics Review
- Weekly review of SLO adherence
- Monthly adjustment of thresholds based on data
- Quarterly assessment of quality gate effectiveness

### Feedback Loop
- Failed promotions analyzed for root cause
- Quality gate refinements based on actual friction
- Agent-specific optimizations identified and shared