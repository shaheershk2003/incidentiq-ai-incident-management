import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  OnInit
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Api } from '../../services/api';
import { Auth } from '../../services/auth';

@Component({
  selector: 'app-incidents',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './incidents.html',
  styleUrl: './incidents.scss'
})
export class Incidents implements OnInit {

  incidents: any[] = [];
  filteredIncidents: any[] = [];

  loading = true;
  errorMessage = '';

  searchTerm = '';
  statusFilter = 'ALL';
  priorityFilter = 'ALL';
  sortOption = 'NEWEST';

  constructor(
    private api: Api,
    public auth: Auth,
    public router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadIncidents();
  }

  loadIncidents(): void {
    this.loading = true;
    this.errorMessage = '';

    this.api.getIncidents().subscribe({
      next: (data: any[]) => {
        this.incidents = data || [];
        this.applyFilters();
        this.loading = false;
        this.cdr.detectChanges();
      },

      error: (error) => {
        console.error(
          'Failed to load incidents:',
          error
        );

        this.errorMessage =
          error?.error?.message ||
          'Unable to load incidents. Please try again.';

        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  applyFilters(): void {
    const search =
      this.searchTerm.trim().toLowerCase();

    this.filteredIncidents =
      this.incidents.filter((incident) => {

        const matchesSearch =
          !search ||
          String(
            incident.incidentNumber || ''
          )
            .toLowerCase()
            .includes(search) ||
          String(
            incident.title || ''
          )
            .toLowerCase()
            .includes(search) ||
          String(
            incident.description || ''
          )
            .toLowerCase()
            .includes(search) ||
          String(
            incident.category || ''
          )
            .toLowerCase()
            .includes(search);

        const matchesStatus =
          this.statusFilter === 'ALL' ||
          incident.status === this.statusFilter;

        const matchesPriority =
          this.priorityFilter === 'ALL' ||
          incident.priority === this.priorityFilter;

        return (
          matchesSearch &&
          matchesStatus &&
          matchesPriority
        );
      });

    this.applySorting();
  }

  applySorting(): void {
    const priorityOrder: Record<string, number> = {
      P1: 1,
      P2: 2,
      P3: 3,
      P4: 4
    };

    this.filteredIncidents.sort((a, b) => {

      switch (this.sortOption) {

        case 'OLDEST':
          return (
            new Date(a.createdAt).getTime() -
            new Date(b.createdAt).getTime()
          );

        case 'PRIORITY_HIGH':
          return (
            (priorityOrder[a.priority] ?? 99) -
            (priorityOrder[b.priority] ?? 99)
          );

        case 'PRIORITY_LOW':
          return (
            (priorityOrder[b.priority] ?? 99) -
            (priorityOrder[a.priority] ?? 99)
          );

        case 'NEWEST':
        default:
          return (
            new Date(b.createdAt).getTime() -
            new Date(a.createdAt).getTime()
          );
      }
    });
  }

  onSearch(): void {
    this.applyFilters();
  }

  onSortChange(): void {
    this.applyFilters();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.statusFilter = 'ALL';
    this.priorityFilter = 'ALL';
    this.sortOption = 'NEWEST';

    this.applyFilters();
  }

  viewIncident(
    id: number | string
  ): void {
    this.router.navigate([
      '/incidents',
      id
    ]);
  }

  createIncident(): void {
    this.router.navigate([
      '/incidents/create'
    ]);
  }

  goDashboard(): void {
    this.router.navigate([
      '/dashboard'
    ]);
  }

  logout(): void {
    this.auth.logout();
  }

  getStatusClass(
    status: string
  ): string {

    switch (status) {

      case 'OPEN':
        return 'status-open';

      case 'IN_PROGRESS':
        return 'status-progress';

      case 'RESOLVED':
        return 'status-resolved';

      case 'CLOSED':
        return 'status-closed';

      case 'REOPENED':
        return 'status-reopened';

      default:
        return '';
    }
  }

  getPriorityClass(
    priority: string
  ): string {

    switch (priority) {

      case 'P1':
        return 'priority-p1';

      case 'P2':
        return 'priority-p2';

      case 'P3':
        return 'priority-p3';

      case 'P4':
        return 'priority-p4';

      default:
        return '';
    }
  }

  formatStatus(
    status: string
  ): string {

    return String(status || '')
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(
        /\b\w/g,
        char => char.toUpperCase()
      );
  }
}