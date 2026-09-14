import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component } from '@angular/core';
import { Router } from '@angular/router';
import { Api } from '../../services/api';
import { Auth } from '../../services/auth';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard {

  incidents: any[] = [];

  loading = true;
  errorMessage = '';

  stats = {
    total: 0,
    open: 0,
    inProgress: 0,
    resolved: 0,
    closed: 0
  };

  priorityStats = {
    P1: 0,
    P2: 0,
    P3: 0,
    P4: 0
  };

  constructor(
    private api: Api,
    private router: Router,
    private auth: Auth,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.loading = true;
    this.errorMessage = '';

    this.api.getIncidents().subscribe({
      next: (incidents) => {
        this.incidents = incidents || [];
        this.calculateStats();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('DASHBOARD ERROR:', error);

        this.loading = false;
        this.errorMessage =
          error?.error?.message ||
          'Unable to load dashboard data. Please try again.';

        this.cdr.detectChanges();
      }
    });
  }

  calculateStats(): void {
    this.stats = {
      total: this.incidents.length,
      open: this.countStatus('OPEN'),
      inProgress: this.countStatus('IN_PROGRESS'),
      resolved: this.countStatus('RESOLVED'),
      closed: this.countStatus('CLOSED')
    };

    this.priorityStats = {
      P1: this.countPriority('P1'),
      P2: this.countPriority('P2'),
      P3: this.countPriority('P3'),
      P4: this.countPriority('P4')
    };
  }

  countStatus(status: string): number {
    return this.incidents.filter(
      incident => this.normalize(incident.status) === status
    ).length;
  }

  countPriority(priority: string): number {
    return this.incidents.filter(
      incident => this.normalize(incident.priority) === priority
    ).length;
  }

  normalize(value: any): string {
    return String(value || '').trim().toUpperCase();
  }

  get recentIncidents(): any[] {
    return [...this.incidents]
      .sort((a, b) => {
        return (
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime()
        );
      })
      .slice(0, 5);
  }

  get criticalIncidents(): any[] {
    return this.incidents
      .filter(incident => this.normalize(incident.priority) === 'P1')
      .slice(0, 3);
  }

  get priorityTotal(): number {
    return this.incidents.length || 1;
  }

  getPriorityPercentage(priority: string): number {
    const count = this.countPriority(priority);
    return Math.round((count / this.priorityTotal) * 100);
  }

  getStatusPercentage(status: string): number {
    const count = this.countStatus(status);
    return Math.round((count / this.priorityTotal) * 100);
  }

  getStatusClass(status: string): string {
    return this.normalize(status).toLowerCase().replace('_', '-');
  }

  getPriorityClass(priority: string): string {
    return this.normalize(priority).toLowerCase();
  }

  formatStatus(status: string): string {
    return String(status || '')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, char => char.toUpperCase());
  }

  formatCategory(category: string): string {
    return String(category || '')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, char => char.toUpperCase());
  }

  formatDate(date: string): string {
    if (!date) {
      return '—';
    }

    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  viewIncident(id: number): void {
    this.router.navigate(['/incidents', id]);
  }

  goIncidents(): void {
    this.router.navigate(['/incidents']);
  }

  createIncident(): void {
    this.router.navigate(['/incidents/create']);
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}