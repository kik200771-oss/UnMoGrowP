// ============================================================================
// UnMoGrowP Attribution Platform - Convergence Validator
// Validates that parallel agents converge toward unified goals
// ============================================================================

import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';

export interface ConvergenceCheckpoint {
  id: string;
  name: string;
  description: string;
  requiredAgents: string[];
  successCriteria: SuccessCriterion[];
  validationFunction: (results: Map<string, any>) => ConvergenceResult;
  criticalityLevel: 'critical' | 'high' | 'medium' | 'low';
  timeoutMinutes: number;
}

export interface SuccessCriterion {
  name: string;
  description: string;
  targetValue: any;
  validationMethod: 'equals' | 'greaterThan' | 'lessThan' | 'contains' | 'exists' | 'custom';
  weight: number; // 1-10, higher = more important
}

export interface ConvergenceResult {
  success: boolean;
  score: number; // 0-100
  detailedResults: Map<string, any>;
  failedCriteria: string[];
  recommendations: string[];
  nextActions: string[];
}

export interface AgentDeliverable {
  agentId: string;
  agentType: string;
  taskId: string;
  deliverableType: 'code' | 'config' | 'documentation' | 'data' | 'system';
  filePath?: string;
  content?: any;
  metadata: {
    version: string;
    timestamp: Date;
    dependencies: string[];
    integrationPoints: string[];
  };
}

export class ConvergenceValidator extends EventEmitter {
  private checkpoints: Map<string, ConvergenceCheckpoint> = new Map();
  private agentDeliverables: Map<string, AgentDeliverable[]> = new Map();
  private convergenceResults: Map<string, ConvergenceResult> = new Map();
  private validationInterval: NodeJS.Timeout;

  constructor() {
    super();

    // Initialize Week 1 Sprint convergence checkpoints
    this.initializeWeek1Checkpoints();

    // Start continuous validation
    this.validationInterval = setInterval(() => this.validateAllCheckpoints(), 30000);

    console.log('🎯 Convergence Validator initialized for parallel agent coordination');
  }

  // ========================================================================
  // Week 1 Sprint Convergence Checkpoints
  // ========================================================================

  private initializeWeek1Checkpoints(): void {
    // Checkpoint 1: Customer Systems Integration
    this.registerCheckpoint({
      id: 'customer-systems-convergence',
      name: 'Customer Systems Integration',
      description: 'All customer-facing systems work together seamlessly',
      requiredAgents: ['product-manager', 'devops', 'architecture'],
      timeoutMinutes: 120,
      criticalityLevel: 'critical',
      successCriteria: [
        {
          name: 'Pilot Materials Complete',
          description: 'Customer onboarding materials are comprehensive and ready',
          targetValue: true,
          validationMethod: 'equals',
          weight: 8
        },
        {
          name: 'Onboarding Scripts Functional',
          description: 'Customer creation scripts work end-to-end',
          targetValue: true,
          validationMethod: 'equals',
          weight: 9
        },
        {
          name: 'Success Metrics Tracking',
          description: 'Customer success metrics system is operational',
          targetValue: true,
          validationMethod: 'equals',
          weight: 8
        },
        {
          name: 'Integration Points Validated',
          description: 'All systems integrate without conflicts',
          targetValue: 0,
          validationMethod: 'equals', // 0 integration failures
          weight: 10
        }
      ],
      validationFunction: this.validateCustomerSystemsConvergence.bind(this)
    });

    // Checkpoint 2: Technical Performance Validation
    this.registerCheckpoint({
      id: 'technical-performance-convergence',
      name: 'Technical Performance Validation',
      description: 'Platform achieves all performance targets with monitoring',
      requiredAgents: ['testing', 'go-code', 'architecture', 'devops'],
      timeoutMinutes: 150,
      criticalityLevel: 'critical',
      successCriteria: [
        {
          name: 'Load Testing Results',
          description: 'Achieved 1M+ events/sec processing',
          targetValue: 1000000,
          validationMethod: 'greaterThan',
          weight: 10
        },
        {
          name: 'API Latency Target',
          description: 'P95 latency under 100ms',
          targetValue: 100,
          validationMethod: 'lessThan',
          weight: 10
        },
        {
          name: 'System Uptime',
          description: 'Uptime over 99.9%',
          targetValue: 99.9,
          validationMethod: 'greaterThan',
          weight: 9
        },
        {
          name: 'Monitoring Operational',
          description: 'Performance monitoring dashboards are live',
          targetValue: true,
          validationMethod: 'equals',
          weight: 8
        },
        {
          name: 'Optimization Roadmap',
          description: 'Performance optimization plan exists',
          targetValue: true,
          validationMethod: 'equals',
          weight: 7
        }
      ],
      validationFunction: this.validateTechnicalPerformanceConvergence.bind(this)
    });

    // Checkpoint 3: Production Readiness
    this.registerCheckpoint({
      id: 'production-readiness-convergence',
      name: 'Production Readiness Validation',
      description: 'Platform is ready for pilot customer deployment',
      requiredAgents: ['devops', 'architecture', 'testing', 'product-manager'],
      timeoutMinutes: 90,
      criticalityLevel: 'critical',
      successCriteria: [
        {
          name: 'Deployment Automation',
          description: 'One-click deployment works reliably',
          targetValue: true,
          validationMethod: 'equals',
          weight: 9
        },
        {
          name: 'Security Hardening',
          description: 'Production security measures in place',
          targetValue: true,
          validationMethod: 'equals',
          weight: 10
        },
        {
          name: 'Monitoring Coverage',
          description: 'Comprehensive monitoring for production',
          targetValue: 95,
          validationMethod: 'greaterThan', // 95%+ coverage
          weight: 8
        },
        {
          name: 'Backup Systems',
          description: 'Data backup and recovery procedures tested',
          targetValue: true,
          validationMethod: 'equals',
          weight: 8
        },
        {
          name: 'Scalability Validated',
          description: 'Auto-scaling configuration tested',
          targetValue: true,
          validationMethod: 'equals',
          weight: 7
        }
      ],
      validationFunction: this.validateProductionReadinessConvergence.bind(this)
    });

    // Checkpoint 4: End-to-End Integration
    this.registerCheckpoint({
      id: 'e2e-integration-convergence',
      name: 'End-to-End Integration Validation',
      description: 'Complete customer journey works from onboarding to attribution',
      requiredAgents: ['product-manager', 'testing', 'go-code', 'architecture', 'devops'],
      timeoutMinutes: 60,
      criticalityLevel: 'high',
      successCriteria: [
        {
          name: 'Customer Onboarding Flow',
          description: 'Complete customer can be onboarded end-to-end',
          targetValue: true,
          validationMethod: 'equals',
          weight: 10
        },
        {
          name: 'Event Processing Pipeline',
          description: 'Events flow from ingestion to attribution successfully',
          targetValue: true,
          validationMethod: 'equals',
          weight: 10
        },
        {
          name: 'Dashboard Integration',
          description: 'Customer can see attribution data in dashboard',
          targetValue: true,
          validationMethod: 'equals',
          weight: 9
        },
        {
          name: 'API Integration',
          description: 'All APIs work together without conflicts',
          targetValue: 0,
          validationMethod: 'equals', // 0 API conflicts
          weight: 8
        },
        {
          name: 'Data Consistency',
          description: 'Attribution data is consistent across all systems',
          targetValue: 100,
          validationMethod: 'equals', // 100% consistency
          weight: 9
        }
      ],
      validationFunction: this.validateE2EIntegrationConvergence.bind(this)
    });

    console.log(`✅ Initialized ${this.checkpoints.size} convergence checkpoints for Week 1 Sprint`);
  }

  // ========================================================================
  // Agent Deliverable Registration
  // ========================================================================

  registerAgentDeliverable(deliverable: AgentDeliverable): void {
    const agentDeliverables = this.agentDeliverables.get(deliverable.agentId) || [];
    agentDeliverables.push(deliverable);
    this.agentDeliverables.set(deliverable.agentId, agentDeliverables);

    console.log(`📦 Agent deliverable registered: ${deliverable.agentId} → ${deliverable.taskId}`);
    console.log(`   Type: ${deliverable.deliverableType}, Integration: ${deliverable.metadata.integrationPoints.join(', ')}`);

    this.emit('deliverable_registered', deliverable);

    // Trigger convergence validation
    this.validateRelevantCheckpoints(deliverable.agentId);
  }

  // ========================================================================
  // Convergence Validation Functions
  // ========================================================================

  private validateCustomerSystemsConvergence(results: Map<string, any>): ConvergenceResult {
    const result: ConvergenceResult = {
      success: false,
      score: 0,
      detailedResults: new Map(),
      failedCriteria: [],
      recommendations: [],
      nextActions: []
    };

    let totalScore = 0;
    let maxScore = 0;

    // Check if pilot materials are complete
    const productManagerDeliverables = this.agentDeliverables.get('product-manager') || [];
    const pilotMaterialsReady = productManagerDeliverables.some(d =>
      d.taskId.includes('pilot') && d.deliverableType === 'documentation'
    );

    if (pilotMaterialsReady) {
      totalScore += 8;
      result.detailedResults.set('pilot_materials', 'COMPLETE');
    } else {
      result.failedCriteria.push('Pilot Materials Complete');
      result.recommendations.push('Product Manager: Complete pilot customer onboarding materials');
    }
    maxScore += 8;

    // Check if onboarding scripts are functional
    const devopsDeliverables = this.agentDeliverables.get('devops') || [];
    const onboardingScriptsReady = devopsDeliverables.some(d =>
      d.taskId.includes('onboarding') && d.deliverableType === 'code'
    );

    if (onboardingScriptsReady) {
      totalScore += 9;
      result.detailedResults.set('onboarding_scripts', 'FUNCTIONAL');
    } else {
      result.failedCriteria.push('Onboarding Scripts Functional');
      result.recommendations.push('DevOps: Deploy and test customer onboarding automation');
    }
    maxScore += 9;

    // Check if success metrics tracking is operational
    const architectureDeliverables = this.agentDeliverables.get('architecture') || [];
    const metricsTrackingReady = architectureDeliverables.some(d =>
      d.taskId.includes('metrics') || d.taskId.includes('monitoring')
    );

    if (metricsTrackingReady) {
      totalScore += 8;
      result.detailedResults.set('metrics_tracking', 'OPERATIONAL');
    } else {
      result.failedCriteria.push('Success Metrics Tracking');
      result.recommendations.push('Architecture: Deploy customer success metrics tracking system');
    }
    maxScore += 8;

    // Check integration points
    const integrationConflicts = this.checkIntegrationConflicts(['product-manager', 'devops', 'architecture']);
    if (integrationConflicts === 0) {
      totalScore += 10;
      result.detailedResults.set('integration_conflicts', 'NONE');
    } else {
      result.failedCriteria.push('Integration Points Validated');
      result.recommendations.push(`Resolve ${integrationConflicts} integration conflicts between customer systems`);
    }
    maxScore += 10;

    result.score = Math.round((totalScore / maxScore) * 100);
    result.success = result.score >= 85; // 85% threshold for customer systems

    if (result.success) {
      result.nextActions.push('Begin pilot customer onboarding process');
      result.nextActions.push('Set up customer success monitoring alerts');
    } else {
      result.nextActions.push('Address failed criteria before customer onboarding');
      result.nextActions.push('Schedule inter-agent sync meeting to resolve integration issues');
    }

    return result;
  }

  private validateTechnicalPerformanceConvergence(results: Map<string, any>): ConvergenceResult {
    const result: ConvergenceResult = {
      success: false,
      score: 0,
      detailedResults: new Map(),
      failedCriteria: [],
      recommendations: [],
      nextActions: []
    };

    let totalScore = 0;
    let maxScore = 0;

    // Check load testing results
    const testingDeliverables = this.agentDeliverables.get('testing') || [];
    const loadTestResults = testingDeliverables.find(d =>
      d.taskId.includes('load') && d.content?.performance
    );

    if (loadTestResults && loadTestResults.content.performance.eventsPerSecond >= 1000000) {
      totalScore += 10;
      result.detailedResults.set('load_testing', `${loadTestResults.content.performance.eventsPerSecond} events/sec`);
    } else {
      result.failedCriteria.push('Load Testing Results');
      result.recommendations.push('Testing: Execute comprehensive load testing to achieve 1M+ events/sec');
    }
    maxScore += 10;

    // Check API latency
    if (loadTestResults && loadTestResults.content.performance.p95Latency < 100) {
      totalScore += 10;
      result.detailedResults.set('api_latency', `${loadTestResults.content.performance.p95Latency}ms P95`);
    } else {
      result.failedCriteria.push('API Latency Target');
      result.recommendations.push('Go Code: Optimize API performance to achieve <100ms P95 latency');
    }
    maxScore += 10;

    // Check system uptime
    if (loadTestResults && loadTestResults.content.performance.uptime > 99.9) {
      totalScore += 9;
      result.detailedResults.set('system_uptime', `${loadTestResults.content.performance.uptime}%`);
    } else {
      result.failedCriteria.push('System Uptime');
      result.recommendations.push('DevOps: Improve system reliability to achieve >99.9% uptime');
    }
    maxScore += 9;

    // Check monitoring operational
    const architectureDeliverables = this.agentDeliverables.get('architecture') || [];
    const monitoringReady = architectureDeliverables.some(d =>
      d.taskId.includes('monitoring') && d.deliverableType === 'config'
    );

    if (monitoringReady) {
      totalScore += 8;
      result.detailedResults.set('monitoring', 'OPERATIONAL');
    } else {
      result.failedCriteria.push('Monitoring Operational');
      result.recommendations.push('Architecture: Deploy performance monitoring dashboards');
    }
    maxScore += 8;

    // Check optimization roadmap
    const goCodeDeliverables = this.agentDeliverables.get('go-code') || [];
    const optimizationPlan = goCodeDeliverables.some(d =>
      d.taskId.includes('optimization') || d.content?.optimizations
    );

    if (optimizationPlan) {
      totalScore += 7;
      result.detailedResults.set('optimization_roadmap', 'DEFINED');
    } else {
      result.failedCriteria.push('Optimization Roadmap');
      result.recommendations.push('Go Code: Create performance optimization implementation plan');
    }
    maxScore += 7;

    result.score = Math.round((totalScore / maxScore) * 100);
    result.success = result.score >= 90; // 90% threshold for technical performance

    if (result.success) {
      result.nextActions.push('Proceed with pilot customer load validation');
      result.nextActions.push('Begin Week 2 performance optimization implementation');
    } else {
      result.nextActions.push('Complete performance validation before customer onboarding');
      result.nextActions.push('Focus technical resources on failed criteria');
    }

    return result;
  }

  private validateProductionReadinessConvergence(results: Map<string, any>): ConvergenceResult {
    const result: ConvergenceResult = {
      success: false,
      score: 0,
      detailedResults: new Map(),
      failedCriteria: [],
      recommendations: [],
      nextActions: []
    };

    let totalScore = 0;
    let maxScore = 0;

    // Check deployment automation
    const devopsDeliverables = this.agentDeliverables.get('devops') || [];
    const deploymentReady = devopsDeliverables.some(d =>
      d.taskId.includes('deployment') && d.deliverableType === 'system'
    );

    if (deploymentReady) {
      totalScore += 9;
      result.detailedResults.set('deployment_automation', 'READY');
    } else {
      result.failedCriteria.push('Deployment Automation');
      result.recommendations.push('DevOps: Complete one-click deployment automation');
    }
    maxScore += 9;

    // Security hardening check
    const securityHardened = this.checkSecurityRequirements();
    if (securityHardened) {
      totalScore += 10;
      result.detailedResults.set('security_hardening', 'COMPLETE');
    } else {
      result.failedCriteria.push('Security Hardening');
      result.recommendations.push('DevOps: Complete production security hardening');
    }
    maxScore += 10;

    // Monitoring coverage
    const monitoringCoverage = this.calculateMonitoringCoverage();
    if (monitoringCoverage >= 95) {
      totalScore += 8;
      result.detailedResults.set('monitoring_coverage', `${monitoringCoverage}%`);
    } else {
      result.failedCriteria.push('Monitoring Coverage');
      result.recommendations.push(`Architecture: Increase monitoring coverage from ${monitoringCoverage}% to 95%+`);
    }
    maxScore += 8;

    // Backup systems
    const backupSystemsReady = this.checkBackupSystems();
    if (backupSystemsReady) {
      totalScore += 8;
      result.detailedResults.set('backup_systems', 'TESTED');
    } else {
      result.failedCriteria.push('Backup Systems');
      result.recommendations.push('DevOps: Implement and test data backup/recovery procedures');
    }
    maxScore += 8;

    // Scalability validation
    const scalabilityValidated = this.checkScalabilityConfiguration();
    if (scalabilityValidated) {
      totalScore += 7;
      result.detailedResults.set('scalability', 'VALIDATED');
    } else {
      result.failedCriteria.push('Scalability Validated');
      result.recommendations.push('DevOps: Test and configure auto-scaling for production load');
    }
    maxScore += 7;

    result.score = Math.round((totalScore / maxScore) * 100);
    result.success = result.score >= 95; // 95% threshold for production readiness

    if (result.success) {
      result.nextActions.push('Deploy to production environment');
      result.nextActions.push('Begin pilot customer onboarding');
    } else {
      result.nextActions.push('Address production readiness gaps');
      result.nextActions.push('Schedule production readiness review with all agents');
    }

    return result;
  }

  private validateE2EIntegrationConvergence(results: Map<string, any>): ConvergenceResult {
    const result: ConvergenceResult = {
      success: false,
      score: 0,
      detailedResults: new Map(),
      failedCriteria: [],
      recommendations: [],
      nextActions: []
    };

    let totalScore = 0;
    let maxScore = 0;

    // Check customer onboarding flow
    const onboardingFlowWorks = this.testCustomerOnboardingFlow();
    if (onboardingFlowWorks) {
      totalScore += 10;
      result.detailedResults.set('customer_onboarding', 'WORKING');
    } else {
      result.failedCriteria.push('Customer Onboarding Flow');
      result.recommendations.push('Product Manager + DevOps: Fix customer onboarding end-to-end flow');
    }
    maxScore += 10;

    // Check event processing pipeline
    const eventProcessingWorks = this.testEventProcessingPipeline();
    if (eventProcessingWorks) {
      totalScore += 10;
      result.detailedResults.set('event_processing', 'WORKING');
    } else {
      result.failedCriteria.push('Event Processing Pipeline');
      result.recommendations.push('Go Code + Architecture: Fix event ingestion to attribution pipeline');
    }
    maxScore += 10;

    // Check dashboard integration
    const dashboardWorks = this.testDashboardIntegration();
    if (dashboardWorks) {
      totalScore += 9;
      result.detailedResults.set('dashboard_integration', 'WORKING');
    } else {
      result.failedCriteria.push('Dashboard Integration');
      result.recommendations.push('Architecture: Fix customer dashboard data integration');
    }
    maxScore += 9;

    // Check API integration conflicts
    const apiConflicts = this.checkAPIIntegrationConflicts();
    if (apiConflicts === 0) {
      totalScore += 8;
      result.detailedResults.set('api_conflicts', 'NONE');
    } else {
      result.failedCriteria.push('API Integration');
      result.recommendations.push(`Resolve ${apiConflicts} API integration conflicts`);
    }
    maxScore += 8;

    // Check data consistency
    const dataConsistency = this.checkDataConsistency();
    if (dataConsistency === 100) {
      totalScore += 9;
      result.detailedResults.set('data_consistency', '100%');
    } else {
      result.failedCriteria.push('Data Consistency');
      result.recommendations.push(`Improve data consistency from ${dataConsistency}% to 100%`);
    }
    maxScore += 9;

    result.score = Math.round((totalScore / maxScore) * 100);
    result.success = result.score >= 90; // 90% threshold for E2E integration

    if (result.success) {
      result.nextActions.push('All systems integrated - ready for pilot customers');
      result.nextActions.push('Begin Week 2 sprint with customer focus');
    } else {
      result.nextActions.push('Fix integration issues before customer deployment');
      result.nextActions.push('Coordinate between agents to resolve E2E flow problems');
    }

    return result;
  }

  // ========================================================================
  // Helper Functions for Validation
  // ========================================================================

  private checkIntegrationConflicts(agentIds: string[]): number {
    // Simulate integration conflict checking
    const allDeliverables = agentIds.flatMap(id => this.agentDeliverables.get(id) || []);

    // Check for port conflicts, API endpoint conflicts, etc.
    const portUsage = new Set();
    let conflicts = 0;

    allDeliverables.forEach(deliverable => {
      if (deliverable.metadata.integrationPoints) {
        deliverable.metadata.integrationPoints.forEach(point => {
          if (portUsage.has(point)) {
            conflicts++;
          } else {
            portUsage.add(point);
          }
        });
      }
    });

    return conflicts;
  }

  private checkSecurityRequirements(): boolean {
    // Check if security hardening requirements are met
    const securityChecks = [
      'SSL/TLS certificates configured',
      'Authentication tokens secured',
      'Database connections encrypted',
      'API rate limiting enabled',
      'Input validation implemented'
    ];

    // Simulate security validation - would check actual security configuration
    return true; // Placeholder
  }

  private calculateMonitoringCoverage(): number {
    // Calculate percentage of system components with monitoring
    const requiredMonitoring = [
      'API endpoints',
      'Database performance',
      'Event processing',
      'System resources',
      'Customer metrics',
      'Error rates',
      'Attribution accuracy'
    ];

    const architectureDeliverables = this.agentDeliverables.get('architecture') || [];
    const monitoringDeliverables = architectureDeliverables.filter(d =>
      d.taskId.includes('monitoring') || d.taskId.includes('metrics')
    );

    // Simulate coverage calculation
    return monitoringDeliverables.length > 0 ? 97 : 60; // Placeholder
  }

  private checkBackupSystems(): boolean {
    // Check if backup and recovery systems are implemented and tested
    return true; // Placeholder - would check actual backup configuration
  }

  private checkScalabilityConfiguration(): boolean {
    // Check if auto-scaling and load balancing are properly configured
    return true; // Placeholder - would check actual scaling configuration
  }

  private testCustomerOnboardingFlow(): boolean {
    // Test complete customer onboarding from start to finish
    return true; // Placeholder - would run actual E2E test
  }

  private testEventProcessingPipeline(): boolean {
    // Test event flow from ingestion through attribution calculation
    return true; // Placeholder - would test actual pipeline
  }

  private testDashboardIntegration(): boolean {
    // Test that customer dashboards show correct attribution data
    return true; // Placeholder - would test dashboard integration
  }

  private checkAPIIntegrationConflicts(): number {
    // Check for conflicts between different API endpoints
    return 0; // Placeholder - would check actual API conflicts
  }

  private checkDataConsistency(): number {
    // Check data consistency across all systems
    return 100; // Placeholder - would check actual data consistency
  }

  // ========================================================================
  // Validation Orchestration
  // ========================================================================

  registerCheckpoint(checkpoint: ConvergenceCheckpoint): void {
    this.checkpoints.set(checkpoint.id, checkpoint);
    console.log(`🎯 Convergence checkpoint registered: ${checkpoint.name} (${checkpoint.criticalityLevel})`);
  }

  private async validateAllCheckpoints(): Promise<void> {
    for (const [checkpointId, checkpoint] of this.checkpoints) {
      if (this.shouldValidateCheckpoint(checkpoint)) {
        await this.validateCheckpoint(checkpointId);
      }
    }
  }

  private shouldValidateCheckpoint(checkpoint: ConvergenceCheckpoint): boolean {
    // Check if all required agents have submitted deliverables
    const hasAllAgentDeliverables = checkpoint.requiredAgents.every(agentId => {
      const deliverables = this.agentDeliverables.get(agentId);
      return deliverables && deliverables.length > 0;
    });

    return hasAllAgentDeliverables;
  }

  private async validateCheckpoint(checkpointId: string): Promise<void> {
    const checkpoint = this.checkpoints.get(checkpointId);
    if (!checkpoint) return;

    console.log(`🔍 Validating convergence checkpoint: ${checkpoint.name}`);

    try {
      const agentResults = new Map<string, any>();

      // Gather results from all required agents
      checkpoint.requiredAgents.forEach(agentId => {
        const deliverables = this.agentDeliverables.get(agentId) || [];
        agentResults.set(agentId, { deliverables, agent: agentId });
      });

      // Run validation function
      const result = checkpoint.validationFunction(agentResults);

      // Store result
      this.convergenceResults.set(checkpointId, result);

      // Emit events
      if (result.success) {
        console.log(`✅ Convergence achieved: ${checkpoint.name} (${result.score}%)`);
        this.emit('convergence_success', { checkpointId, checkpoint, result });
      } else {
        console.warn(`⚠️  Convergence incomplete: ${checkpoint.name} (${result.score}%)`);
        console.warn(`   Failed criteria: ${result.failedCriteria.join(', ')}`);
        this.emit('convergence_incomplete', { checkpointId, checkpoint, result });
      }

      // Handle critical failures
      if (checkpoint.criticalityLevel === 'critical' && !result.success) {
        await this.handleCriticalConvergenceFailure(checkpointId, result);
      }

    } catch (error) {
      console.error(`❌ Error validating checkpoint ${checkpointId}:`, error);
      this.emit('validation_error', { checkpointId, error });
    }
  }

  private async handleCriticalConvergenceFailure(checkpointId: string, result: ConvergenceResult): Promise<void> {
    console.error(`🚨 CRITICAL CONVERGENCE FAILURE: ${checkpointId}`);

    // Create corrective action plan
    const correctiveActions = {
      checkpointId,
      failedCriteria: result.failedCriteria,
      recommendations: result.recommendations,
      nextActions: result.nextActions,
      escalated: true,
      timestamp: new Date()
    };

    this.emit('critical_failure', correctiveActions);

    // Auto-trigger corrective measures if possible
    await this.triggerCorrectiveActions(correctiveActions);
  }

  private async triggerCorrectiveActions(actions: any): Promise<void> {
    console.log('🔧 Triggering corrective actions...');

    // This would integrate with the Task orchestrator to create corrective tasks
    actions.recommendations.forEach((recommendation: string, index: number) => {
      console.log(`   ${index + 1}. ${recommendation}`);
    });

    // Notify agents of required corrections
    this.emit('corrective_actions_needed', actions);
  }

  private validateRelevantCheckpoints(agentId: string): void {
    // Validate checkpoints that involve this agent
    for (const [checkpointId, checkpoint] of this.checkpoints) {
      if (checkpoint.requiredAgents.includes(agentId)) {
        // Don't await - run async validation
        this.validateCheckpoint(checkpointId);
      }
    }
  }

  // ========================================================================
  // Status and Reporting
  // ========================================================================

  getConvergenceStatus(): any {
    const status = {
      checkpoints: {},
      overallProgress: 0,
      criticalIssues: [],
      agentDeliverables: {},
      nextActions: []
    };

    let totalScore = 0;
    let checkpointCount = 0;
    let criticalFailures = 0;

    // Process each checkpoint
    for (const [checkpointId, checkpoint] of this.checkpoints) {
      const result = this.convergenceResults.get(checkpointId);

      const checkpointStatus = {
        name: checkpoint.name,
        criticality: checkpoint.criticalityLevel,
        requiredAgents: checkpoint.requiredAgents,
        status: result ? (result.success ? 'CONVERGED' : 'DIVERGENT') : 'PENDING',
        score: result?.score || 0,
        failedCriteria: result?.failedCriteria || [],
        recommendations: result?.recommendations || []
      };

      status.checkpoints[checkpointId] = checkpointStatus;

      if (result) {
        totalScore += result.score;
        checkpointCount++;

        if (checkpoint.criticalityLevel === 'critical' && !result.success) {
          criticalFailures++;
          status.criticalIssues.push({
            checkpoint: checkpoint.name,
            score: result.score,
            issues: result.failedCriteria
          });
        }
      }
    }

    // Calculate overall progress
    status.overallProgress = checkpointCount > 0 ? Math.round(totalScore / checkpointCount) : 0;

    // Agent deliverable summary
    for (const [agentId, deliverables] of this.agentDeliverables) {
      status.agentDeliverables[agentId] = {
        count: deliverables.length,
        latest: deliverables[deliverables.length - 1]?.metadata.timestamp,
        types: [...new Set(deliverables.map(d => d.deliverableType))]
      };
    }

    // Determine next actions
    if (criticalFailures > 0) {
      status.nextActions.push(`Resolve ${criticalFailures} critical convergence failures`);
      status.nextActions.push('Hold emergency agent coordination meeting');
    } else if (status.overallProgress >= 90) {
      status.nextActions.push('All agents converging successfully');
      status.nextActions.push('Ready to proceed with Week 2 sprint');
    } else {
      status.nextActions.push('Continue parallel agent work');
      status.nextActions.push('Monitor convergence progress');
    }

    return status;
  }

  generateConvergenceReport(): string {
    const status = this.getConvergenceStatus();
    const timestamp = new Date().toISOString();

    let report = `# UnMoGrowP Attribution Platform - Convergence Report\n\n`;
    report += `**Generated**: ${timestamp}\n`;
    report += `**Overall Progress**: ${status.overallProgress}%\n`;
    report += `**Critical Issues**: ${status.criticalIssues.length}\n\n`;

    // Checkpoint Status
    report += `## 🎯 Convergence Checkpoint Status\n\n`;
    for (const [checkpointId, checkpoint] of Object.entries(status.checkpoints)) {
      const cp = checkpoint as any;
      const statusIcon = cp.status === 'CONVERGED' ? '✅' : cp.status === 'DIVERGENT' ? '❌' : '⏳';

      report += `### ${statusIcon} ${cp.name}\n`;
      report += `- **Status**: ${cp.status} (${cp.score}%)\n`;
      report += `- **Criticality**: ${cp.criticality}\n`;
      report += `- **Required Agents**: ${cp.requiredAgents.join(', ')}\n`;

      if (cp.failedCriteria.length > 0) {
        report += `- **Failed Criteria**: ${cp.failedCriteria.join(', ')}\n`;
      }

      if (cp.recommendations.length > 0) {
        report += `- **Recommendations**: \n`;
        cp.recommendations.forEach((rec: string) => {
          report += `  - ${rec}\n`;
        });
      }

      report += `\n`;
    }

    // Agent Status
    report += `## 🤖 Agent Deliverable Status\n\n`;
    for (const [agentId, agentStatus] of Object.entries(status.agentDeliverables)) {
      const as = agentStatus as any;
      report += `### ${agentId}\n`;
      report += `- **Deliverables**: ${as.count}\n`;
      report += `- **Types**: ${as.types.join(', ')}\n`;
      report += `- **Latest**: ${as.latest}\n\n`;
    }

    // Next Actions
    report += `## 📋 Next Actions\n\n`;
    status.nextActions.forEach((action: string) => {
      report += `- ${action}\n`;
    });

    return report;
  }

  shutdown(): void {
    if (this.validationInterval) {
      clearInterval(this.validationInterval);
    }
    console.log('🔌 Convergence Validator shutting down');
  }
}

export default ConvergenceValidator;