
export interface ICUStatus {
  icu: number;
  ward: number;
  ed: number;
  icuTotal: number;
  wardTotal: number;
  edTotal: number;
}

export interface ICUAlert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  priority: number;
}

export class ICUStatusService {
  private static instance: ICUStatusService;
  private status: ICUStatus;
  private alerts: ICUAlert[];
  private lastUpdate: Date;

  private constructor() {
    this.status = {
      icu: 15,
      ward: 38,
      ed: 12,
      icuTotal: 20,
      wardTotal: 50,
      edTotal: 25
    };
    this.alerts = [];
    this.lastUpdate = new Date();
    this.generateRealisticAlerts();
  }

  static getInstance(): ICUStatusService {
    if (!ICUStatusService.instance) {
      ICUStatusService.instance = new ICUStatusService();
    }
    return ICUStatusService.instance;
  }

  getCurrentStatus(): ICUStatus {
    this.updateRealisticStatus();
    return this.status;
  }

  getAlerts(): ICUAlert[] {
    return this.alerts.sort((a, b) => b.priority - a.priority);
  }

  getICUOccupancyLevel(): 'normal' | 'warning' | 'critical' {
    const percentage = (this.status.icu / this.status.icuTotal) * 100;
    if (percentage >= 90) return 'critical';
    if (percentage >= 75) return 'warning';
    return 'normal';
  }

  private updateRealisticStatus() {
    const now = new Date();
    const timeDiff = now.getTime() - this.lastUpdate.getTime();
    
    // Update every 30 seconds with realistic fluctuations
    if (timeDiff > 30000) {
      // ICU changes slowly (admissions/discharges)
      const icuChange = Math.random() > 0.7 ? (Math.random() > 0.5 ? 1 : -1) : 0;
      this.status.icu = Math.max(0, Math.min(this.status.icuTotal, this.status.icu + icuChange));

      // Ward changes more frequently
      const wardChange = Math.random() > 0.5 ? (Math.random() > 0.5 ? 1 : -1) : 0;
      this.status.ward = Math.max(0, Math.min(this.status.wardTotal, this.status.ward + wardChange));

      // ED changes frequently (patients coming and going)
      const edChange = Math.floor((Math.random() - 0.5) * 4);
      this.status.ed = Math.max(0, Math.min(this.status.edTotal, this.status.ed + edChange));

      this.lastUpdate = now;
      this.updateAlerts();
    }
  }

  private generateRealisticAlerts() {
    const baseAlerts: Omit<ICUAlert, 'id' | 'timestamp'>[] = [
      {
        type: 'warning',
        title: 'ICU Capacity Alert',
        message: 'ICU is approaching maximum capacity. Consider discharge planning.',
        priority: 8
      },
      {
        type: 'info',
        title: 'Staff Handover',
        message: 'Night shift handover scheduled for 7:00 PM',
        priority: 3
      }
    ];

    this.alerts = baseAlerts.map(alert => ({
      ...alert,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date(Date.now() - Math.random() * 3600000) // Random time in last hour
    }));
  }

  private updateAlerts() {
    // Remove old alerts
    this.alerts = this.alerts.filter(alert => 
      Date.now() - alert.timestamp.getTime() < 24 * 60 * 60 * 1000 // Keep for 24 hours
    );

    // Add new alerts based on current status
    const icuLevel = this.getICUOccupancyLevel();
    
    if (icuLevel === 'critical' && !this.alerts.some(a => a.title.includes('Critical'))) {
      this.alerts.push({
        id: Math.random().toString(36).substr(2, 9),
        type: 'critical',
        title: 'Critical ICU Capacity',
        message: 'ICU is at critical capacity. Immediate action required.',
        timestamp: new Date(),
        priority: 10
      });
    }

    if (this.status.ed > 20 && !this.alerts.some(a => a.title.includes('Emergency'))) {
      this.alerts.push({
        id: Math.random().toString(36).substr(2, 9),
        type: 'warning',
        title: 'Emergency Department Busy',
        message: 'ED experiencing high patient volume',
        timestamp: new Date(),
        priority: 6
      });
    }
  }

  refreshData(): ICUStatus {
    // Force update for manual refresh
    this.lastUpdate = new Date(0);
    return this.getCurrentStatus();
  }
}
