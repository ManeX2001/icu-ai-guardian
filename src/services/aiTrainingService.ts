export interface TrainingMetrics {
  currentEpoch: number;
  totalEpochs: number;
  accuracy: number;
  loss: number;
  rewardScore: number;
  patientsProcessed: number;
  correctDecisions: number;
  isTraining: boolean;
  lastTrainingTime: Date | null;
  trainingProgress: number;
}

export interface TrainingReward {
  action: string;
  outcome: 'positive' | 'negative';
  points: number;
  reason: string;
  timestamp: Date;
}

export class AITrainingService {
  private static instance: AITrainingService;
  private metrics: TrainingMetrics;
  private recentRewards: TrainingReward[];
  private trainingInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.metrics = {
      currentEpoch: 247,
      totalEpochs: 1000,
      accuracy: 89.4,
      loss: 0.23,
      rewardScore: 847.2,
      patientsProcessed: 2847,
      correctDecisions: 2544,
      isTraining: false,
      lastTrainingTime: new Date(Date.now() - 3600000), // 1 hour ago
      trainingProgress: 24.7
    };
    
    this.recentRewards = this.generateRecentRewards();
  }

  static getInstance(): AITrainingService {
    if (!AITrainingService.instance) {
      AITrainingService.instance = new AITrainingService();
    }
    return AITrainingService.instance;
  }

  getMetrics(): TrainingMetrics {
    return { ...this.metrics };
  }

  getRecentRewards(): TrainingReward[] {
    return [...this.recentRewards].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  startTraining(): Promise<void> {
    return new Promise((resolve) => {
      if (this.metrics.isTraining) return resolve();

      this.metrics.isTraining = true;
      this.metrics.lastTrainingTime = new Date();
      let progress = 0;

      this.trainingInterval = setInterval(() => {
        progress += 1;
        this.metrics.trainingProgress = (this.metrics.currentEpoch + progress / 100) / this.metrics.totalEpochs * 100;

        // Simulate training progress
        if (progress % 10 === 0) {
          this.metrics.accuracy += (Math.random() - 0.3) * 0.5;
          this.metrics.loss -= (Math.random() * 0.01);
          this.metrics.rewardScore += Math.random() * 5;
          
          // Ensure realistic bounds
          this.metrics.accuracy = Math.max(70, Math.min(95, this.metrics.accuracy));
          this.metrics.loss = Math.max(0.1, this.metrics.loss);
        }

        if (progress >= 100) {
          this.completeEpoch();
          this.metrics.isTraining = false;
          if (this.trainingInterval) {
            clearInterval(this.trainingInterval);
            this.trainingInterval = null;
          }
          resolve();
        }
      }, 50); // Update every 50ms for smooth progress
    });
  }

  private completeEpoch() {
    this.metrics.currentEpoch += 1;
    this.metrics.trainingProgress = this.metrics.currentEpoch / this.metrics.totalEpochs * 100;
    
    // Add new training reward
    this.recentRewards.unshift({
      action: 'Epoch Completed',
      outcome: 'positive',
      points: Math.floor(Math.random() * 20) + 10,
      reason: `Completed epoch ${this.metrics.currentEpoch} with improved performance`,
      timestamp: new Date()
    });

    // Keep only recent 20 rewards
    this.recentRewards = this.recentRewards.slice(0, 20);
  }

  addPatientDecision(decision: string, wasCorrect: boolean, actualOutcome: string) {
    this.metrics.patientsProcessed += 1;
    if (wasCorrect) {
      this.metrics.correctDecisions += 1;
    }

    // Update accuracy
    this.metrics.accuracy = (this.metrics.correctDecisions / this.metrics.patientsProcessed) * 100;

    // Add reward/penalty
    const points = wasCorrect ? Math.floor(Math.random() * 15) + 5 : -(Math.floor(Math.random() * 10) + 3);
    this.metrics.rewardScore += points;

    this.recentRewards.unshift({
      action: decision,
      outcome: wasCorrect ? 'positive' : 'negative',
      points,
      reason: wasCorrect 
        ? `Correct ${decision} decision - patient outcome matched prediction`
        : `Suboptimal ${decision} decision - actual outcome: ${actualOutcome}`,
      timestamp: new Date()
    });

    // Keep only recent 20 rewards
    this.recentRewards = this.recentRewards.slice(0, 20);
  }

  private generateRecentRewards(): TrainingReward[] {
    const rewards: TrainingReward[] = [];
    const actions = ['ICU Admission', 'Ward Admission', 'Discharge', 'Specialist Referral'];
    
    for (let i = 0; i < 15; i++) {
      const isPositive = Math.random() > 0.3; // 70% positive outcomes
      rewards.push({
        action: actions[Math.floor(Math.random() * actions.length)],
        outcome: isPositive ? 'positive' : 'negative',
        points: isPositive ? Math.floor(Math.random() * 15) + 5 : -(Math.floor(Math.random() * 10) + 3),
        reason: isPositive 
          ? 'Optimal decision led to improved patient outcome'
          : 'Decision resulted in suboptimal resource utilization',
        timestamp: new Date(Date.now() - Math.random() * 86400000) // Random time in last 24 hours
      });
    }
    
    return rewards;
  }

  getTrainingExplanation(): string {
    return `The AI agent learns through Proximal Policy Optimization (PPO), a reinforcement learning algorithm. 

**Training Process:**
• Each patient decision generates a reward or penalty based on actual outcomes
• Positive rewards (+5 to +20 points): Correct admission decisions, optimal resource usage, improved patient outcomes
• Negative penalties (-3 to -10 points): Incorrect predictions, resource waste, delayed care

**Current Training Focus:**
• Accuracy: ${this.metrics.accuracy.toFixed(1)}% correct decisions
• Processed: ${this.metrics.patientsProcessed.toLocaleString()} patient cases
• Reward Score: ${this.metrics.rewardScore.toFixed(1)} points

**Epoch Definition:**
An epoch represents one complete pass through a batch of patient cases (typically 100-200 patients). The model learns from these cases and updates its decision-making policy. We're currently at epoch ${this.metrics.currentEpoch} of ${this.metrics.totalEpochs}.`;
  }
}
