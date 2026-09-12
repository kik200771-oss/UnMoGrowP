// ============================================================================
// UnMoGrowP Attribution Platform - Parallel Agent Orchestrator
// Coordinates multiple AI agents working simultaneously toward common goals
// ============================================================================

import { EventEmitter } from 'events';

export interface AgentTask {
  id: string;
  agentId: string;
  agentType: 'architecture' | 'go-code' | 'testing' | 'devops' | 'product-manager';
  taskName: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  dependencies: string[]; // Task IDs this depends on
  estimatedDuration: number; // in minutes
  status: 'pending' | 'in_progress' | 'completed' | 'blocked' | 'failed';
  progress: number; // 0-100
  result?: any;
  startTime?: Date;
  completedTime?: Date;
  blockedReason?: string;
}

export interface GlobalGoal {
  id: string;
  name: string;
  description: string;
  successCriteria: string[];
  deadline: Date;
  priority: 'critical' | 'high' | 'medium' | 'low';
  requiredAgents: string[];
  convergencePoints: ConvergencePoint[];
}

export interface ConvergencePoint {
  id: string;
  name: string;
  description: string;
  requiredTasks: string[];
  validationFunction: (results: Map<string, any>) => boolean;
  criticalForSuccess: boolean;
}

export interface AgentProgress {
  agentId: string;
  agentType: string;
  currentTask?: string;
  completedTasks: string[];
  blockedTasks: string[];
  progressPercent: number;
  lastHeartbeat: Date;
  status: 'active' | 'idle' | 'blocked' | 'offline';
}

export class ParallelAgentOrchestrator extends EventEmitter {
  private agents: Map<string, AgentProgress> = new Map();
  private tasks: Map<string, AgentTask> = new Map();
  private goals: Map<string, GlobalGoal> = new Map();
  private taskQueue: string[] = [];
  private completedTasks: Set<string> = new Set();
  private convergenceResults: Map<string, boolean> = new Map();

  private syncInterval: NodeJS.Timeout;
  private convergenceCheckInterval: NodeJS.Timeout;

  constructor() {
    super();

    // Start coordination loops
    this.syncInterval = setInterval(() => this.synchronizeAgents(), 30000); // 30 seconds
    this.convergenceCheckInterval = setInterval(() => this.checkConvergence(), 60000); // 1 minute

    // Register event handlers
    this.setupEventHandlers();
  }

  // ========================================================================
  // Agent Registration and Management
  // ========================================================================

  registerAgent(agentId: string, agentType: string): void {
    const progress: AgentProgress = {
      agentId,
      agentType,
      completedTasks: [],
      blockedTasks: [],
      progressPercent: 0,
      lastHeartbeat: new Date(),
      status: 'idle'
    };

    this.agents.set(agentId, progress);
    this.emit('agent_registered', { agentId, agentType });

    console.log(`🤖 Agent registered: ${agentId} (${agentType})`);
  }

  updateAgentHeartbeat(agentId: string, status?: string, currentTask?: string): void {
    const agent = this.agents.get(agentId);
    if (!agent) return;

    agent.lastHeartbeat = new Date();
    if (status) agent.status = status as any;
    if (currentTask) agent.currentTask = currentTask;

    this.agents.set(agentId, agent);
  }

  // ========================================================================
  // Goal and Task Management
  // ========================================================================

  defineGlobalGoal(goal: GlobalGoal): void {
    this.goals.set(goal.id, goal);
    this.emit('goal_defined', goal);

    console.log(`🎯 Global goal defined: ${goal.name}`);
    console.log(`   Deadline: ${goal.deadline.toISOString()}`);
    console.log(`   Required agents: ${goal.requiredAgents.join(', ')}`);
  }

  createParallelTasks(goalId: string, tasks: Omit<AgentTask, 'id' | 'status' | 'progress'>[]): void {
    const goal = this.goals.get(goalId);
    if (!goal) {
      throw new Error(`Goal ${goalId} not found`);
    }

    // Create task dependency graph
    const taskMap = new Map<string, AgentTask>();

    tasks.forEach((taskTemplate, index) => {
      const task: AgentTask = {
        ...taskTemplate,
        id: `${goalId}_task_${index + 1}`,
        status: 'pending',
        progress: 0
      };

      taskMap.set(task.id, task);
      this.tasks.set(task.id, task);
    });

    // Validate dependencies and queue ready tasks
    this.queueReadyTasks();

    console.log(`📋 Created ${tasks.length} parallel tasks for goal: ${goal.name}`);

    this.emit('tasks_created', { goalId, taskCount: tasks.length });
  }

  private queueReadyTasks(): void {
    for (const [taskId, task] of this.tasks) {
      if (task.status === 'pending' && this.areTaskDependenciesMet(task)) {
        this.taskQueue.push(taskId);
        task.status = 'pending';
      }
    }
  }

  private areTaskDependenciesMet(task: AgentTask): boolean {
    return task.dependencies.every(depId => this.completedTasks.has(depId));
  }

  // ========================================================================
  // Parallel Task Distribution
  // ========================================================================

  async distributeTasksToAgents(): Promise<void> {
    console.log(`🚀 Distributing tasks to ${this.agents.size} agents...`);

    const availableAgents = Array.from(this.agents.values())
      .filter(agent => agent.status === 'idle' || agent.status === 'active');

    // Sort tasks by priority and dependencies
    const readyTasks = this.taskQueue
      .map(taskId => this.tasks.get(taskId)!)
      .sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });

    // Distribute tasks to appropriate agents
    for (const task of readyTasks) {
      const suitableAgent = availableAgents.find(agent =>
        agent.agentType === task.agentType && !agent.currentTask
      );

      if (suitableAgent) {
        await this.assignTaskToAgent(task.id, suitableAgent.agentId);

        // Remove from queue
        const queueIndex = this.taskQueue.indexOf(task.id);
        if (queueIndex > -1) {
          this.taskQueue.splice(queueIndex, 1);
        }
      }
    }
  }

  private async assignTaskToAgent(taskId: string, agentId: string): Promise<void> {
    const task = this.tasks.get(taskId);
    const agent = this.agents.get(agentId);

    if (!task || !agent) return;

    task.status = 'in_progress';
    task.startTime = new Date();
    agent.currentTask = taskId;
    agent.status = 'active';

    this.tasks.set(taskId, task);
    this.agents.set(agentId, agent);

    console.log(`📤 Task assigned: ${task.taskName} → ${agentId}`);

    this.emit('task_assigned', { taskId, agentId, task });

    // Start task execution (this would integrate with actual agent execution)
    await this.executeTaskOnAgent(taskId, agentId);
  }

  private async executeTaskOnAgent(taskId: string, agentId: string): Promise<void> {
    const task = this.tasks.get(taskId);
    if (!task) return;

    try {
      // Simulate task execution with progress updates
      console.log(`🔄 ${agentId} starting: ${task.taskName}`);

      // This would be replaced with actual agent execution
      await this.simulateTaskExecution(task);

      await this.completeTask(taskId, { success: true, data: 'Task completed successfully' });

    } catch (error) {
      console.error(`❌ Task ${taskId} failed on ${agentId}:`, error);
      await this.failTask(taskId, error.message);
    }
  }

  private async simulateTaskExecution(task: AgentTask): Promise<void> {
    const progressIntervals = 10;
    const intervalDuration = (task.estimatedDuration * 60 * 1000) / progressIntervals; // Convert to ms

    for (let i = 1; i <= progressIntervals; i++) {
      await new Promise(resolve => setTimeout(resolve, intervalDuration));

      task.progress = (i / progressIntervals) * 100;
      this.emit('task_progress', { taskId: task.id, progress: task.progress });

      console.log(`📊 ${task.taskName}: ${Math.round(task.progress)}% complete`);
    }
  }

  // ========================================================================
  // Task Completion and Synchronization
  // ========================================================================

  async completeTask(taskId: string, result: any): Promise<void> {
    const task = this.tasks.get(taskId);
    if (!task) return;

    task.status = 'completed';
    task.completedTime = new Date();
    task.progress = 100;
    task.result = result;

    this.tasks.set(taskId, task);
    this.completedTasks.add(taskId);

    // Free up the agent
    const agent = Array.from(this.agents.values()).find(a => a.currentTask === taskId);
    if (agent) {
      agent.currentTask = undefined;
      agent.status = 'idle';
      agent.completedTasks.push(taskId);
      this.agents.set(agent.agentId, agent);
    }

    console.log(`✅ Task completed: ${task.taskName} (${task.agentType})`);

    this.emit('task_completed', { taskId, task, result });

    // Queue any newly available tasks
    this.queueReadyTasks();

    // Distribute new tasks
    await this.distributeTasksToAgents();

    // Check for convergence
    await this.checkConvergence();
  }

  async failTask(taskId: string, reason: string): Promise<void> {
    const task = this.tasks.get(taskId);
    if (!task) return;

    task.status = 'failed';
    task.blockedReason = reason;

    // Free up the agent
    const agent = Array.from(this.agents.values()).find(a => a.currentTask === taskId);
    if (agent) {
      agent.currentTask = undefined;
      agent.status = 'idle';
      agent.blockedTasks.push(taskId);
      this.agents.set(agent.agentId, agent);
    }

    console.error(`❌ Task failed: ${task.taskName} - ${reason}`);

    this.emit('task_failed', { taskId, task, reason });
  }

  // ========================================================================
  // Convergence Validation
  // ========================================================================

  private async checkConvergence(): Promise<void> {
    for (const [goalId, goal] of this.goals) {
      for (const convergencePoint of goal.convergencePoints) {
        if (this.convergenceResults.has(convergencePoint.id)) continue;

        const requiredResults = new Map<string, any>();
        let allTasksComplete = true;

        // Check if all required tasks are completed
        for (const taskId of convergencePoint.requiredTasks) {
          const task = this.tasks.get(taskId);
          if (!task || task.status !== 'completed') {
            allTasksComplete = false;
            break;
          }
          requiredResults.set(taskId, task.result);
        }

        if (allTasksComplete) {
          const convergenceSuccess = convergencePoint.validationFunction(requiredResults);
          this.convergenceResults.set(convergencePoint.id, convergenceSuccess);

          if (convergenceSuccess) {
            console.log(`🎯 Convergence achieved: ${convergencePoint.name}`);
          } else {
            console.warn(`⚠️  Convergence failed: ${convergencePoint.name}`);

            if (convergencePoint.criticalForSuccess) {
              await this.handleCriticalConvergenceFailure(goalId, convergencePoint);
            }
          }

          this.emit('convergence_checked', {
            goalId,
            convergencePoint,
            success: convergenceSuccess
          });
        }
      }

      // Check if goal is complete
      await this.checkGoalCompletion(goalId);
    }
  }

  private async handleCriticalConvergenceFailure(goalId: string, convergencePoint: ConvergencePoint): Promise<void> {
    console.error(`🚨 Critical convergence failure: ${convergencePoint.name}`);

    // Create corrective tasks
    const correctiveTasks = await this.generateCorrectiveTasks(goalId, convergencePoint);

    // Add corrective tasks to execution
    correctiveTasks.forEach(task => {
      this.tasks.set(task.id, task);
      this.taskQueue.push(task.id);
    });

    await this.distributeTasksToAgents();

    this.emit('corrective_action', { goalId, convergencePoint, correctiveTasks });
  }

  private async generateCorrectiveTasks(goalId: string, convergencePoint: ConvergencePoint): Promise<AgentTask[]> {
    // This would be implemented based on specific convergence failure patterns
    // For now, return placeholder corrective tasks

    return [
      {
        id: `${goalId}_corrective_${Date.now()}`,
        agentId: 'architecture',
        agentType: 'architecture',
        taskName: `Fix convergence: ${convergencePoint.name}`,
        description: `Address convergence failure in ${convergencePoint.name}`,
        priority: 'high',
        dependencies: [],
        estimatedDuration: 30,
        status: 'pending',
        progress: 0
      }
    ];
  }

  private async checkGoalCompletion(goalId: string): Promise<void> {
    const goal = this.goals.get(goalId);
    if (!goal) return;

    const allConvergencePointsPass = goal.convergencePoints.every(cp =>
      this.convergenceResults.get(cp.id) === true
    );

    if (allConvergencePointsPass) {
      console.log(`🏆 Goal achieved: ${goal.name}`);
      this.emit('goal_completed', { goalId, goal });
    }
  }

  // ========================================================================
  // Agent Synchronization
  // ========================================================================

  private async synchronizeAgents(): Promise<void> {
    console.log(`🔄 Synchronizing ${this.agents.size} agents...`);

    const now = new Date();
    const staleThreshold = 2 * 60 * 1000; // 2 minutes

    // Check for stale agents
    for (const [agentId, agent] of this.agents) {
      const timeSinceHeartbeat = now.getTime() - agent.lastHeartbeat.getTime();

      if (timeSinceHeartbeat > staleThreshold && agent.status !== 'offline') {
        console.warn(`⚠️  Agent ${agentId} appears offline (${timeSinceHeartbeat}ms since last heartbeat)`);
        agent.status = 'offline';

        // Reassign current task if needed
        if (agent.currentTask) {
          await this.reassignTask(agent.currentTask);
        }
      }
    }

    // Redistribute tasks if needed
    if (this.taskQueue.length > 0) {
      await this.distributeTasksToAgents();
    }

    this.emit('sync_completed', {
      activeAgents: Array.from(this.agents.values()).filter(a => a.status === 'active').length,
      pendingTasks: this.taskQueue.length,
      completedTasks: this.completedTasks.size
    });
  }

  private async reassignTask(taskId: string): Promise<void> {
    const task = this.tasks.get(taskId);
    if (!task) return;

    console.log(`🔄 Reassigning task: ${task.taskName}`);

    task.status = 'pending';
    task.progress = 0;
    task.startTime = undefined;

    this.tasks.set(taskId, task);
    this.taskQueue.push(taskId);

    await this.distributeTasksToAgents();
  }

  // ========================================================================
  // Status and Reporting
  // ========================================================================

  getSystemStatus(): any {
    return {
      agents: Object.fromEntries(this.agents),
      tasks: {
        total: this.tasks.size,
        pending: Array.from(this.tasks.values()).filter(t => t.status === 'pending').length,
        inProgress: Array.from(this.tasks.values()).filter(t => t.status === 'in_progress').length,
        completed: this.completedTasks.size,
        failed: Array.from(this.tasks.values()).filter(t => t.status === 'failed').length
      },
      goals: Object.fromEntries(this.goals),
      convergence: Object.fromEntries(this.convergenceResults)
    };
  }

  getProgressReport(): any {
    const goals = Array.from(this.goals.values()).map(goal => {
      const relatedTasks = Array.from(this.tasks.values()).filter(task =>
        task.id.startsWith(goal.id)
      );

      const completedTaskCount = relatedTasks.filter(t => t.status === 'completed').length;
      const progressPercent = (completedTaskCount / relatedTasks.length) * 100;

      const convergenceStatus = goal.convergencePoints.map(cp => ({
        name: cp.name,
        achieved: this.convergenceResults.get(cp.id) || false,
        critical: cp.criticalForSuccess
      }));

      return {
        goalId: goal.id,
        name: goal.name,
        progressPercent: Math.round(progressPercent),
        tasksCompleted: completedTaskCount,
        totalTasks: relatedTasks.length,
        deadline: goal.deadline,
        convergenceStatus
      };
    });

    return { goals, timestamp: new Date() };
  }

  private setupEventHandlers(): void {
    this.on('task_completed', (data) => {
      console.log(`📊 Progress update: Task "${data.task.taskName}" completed by ${data.task.agentType} agent`);
    });

    this.on('convergence_checked', (data) => {
      if (data.success) {
        console.log(`🎯 Convergence success: ${data.convergencePoint.name}`);
      }
    });

    this.on('goal_completed', (data) => {
      console.log(`🏆 GOAL ACHIEVED: ${data.goal.name}`);
    });
  }

  // ========================================================================
  // Cleanup
  // ========================================================================

  shutdown(): void {
    if (this.syncInterval) clearInterval(this.syncInterval);
    if (this.convergenceCheckInterval) clearInterval(this.convergenceCheckInterval);

    console.log('🔌 Parallel Agent Orchestrator shutting down');
  }
}

export default ParallelAgentOrchestrator;