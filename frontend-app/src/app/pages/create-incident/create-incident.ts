import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Api } from '../../services/api';
import { Auth } from '../../services/auth';

@Component({
  selector: 'app-create-incident',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './create-incident.html',
  styleUrl: './create-incident.scss'
})
export class CreateIncident {

  incident = {
    title: '',
    description: '',
    priority: 'P2',
    category: 'APPLICATION'
  };

  snapshotData: string | null = null;
  snapshotName = '';

  loading = false;
  errorMessage = '';
  submitted = false;

  priorities = ['P1', 'P2', 'P3', 'P4'];

  categories = [
    'APPLICATION',
    'DATABASE',
    'NETWORK',
    'SECURITY',
    'INFRASTRUCTURE',
    'AUTHENTICATION',
    'OTHER'
  ];

  constructor(
    private api: Api,
    private router: Router,
    private auth: Auth
  ) {}

  onSnapshotSelected(
    event: Event
  ): void {
    const input =
      event.target as HTMLInputElement;

    const file =
      input.files?.[0];

    if (!file) {
      return;
    }

    this.errorMessage = '';

    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp'
    ];

    if (!allowedTypes.includes(file.type)) {
      this.errorMessage =
        'Please select a JPG, PNG or WebP image.';
      input.value = '';
      return;
    }

    const maxSize =
      5 * 1024 * 1024;

    if (file.size > maxSize) {
      this.errorMessage =
        'Snapshot size must be 5 MB or smaller.';
      input.value = '';
      return;
    }

    const reader =
      new FileReader();

    reader.onload = () => {
      this.snapshotData =
        String(reader.result);

      this.snapshotName =
        file.name;
    };

    reader.onerror = () => {
      this.snapshotData = null;
      this.snapshotName = '';
      this.errorMessage =
        'Unable to read the selected snapshot.';
    };

    reader.readAsDataURL(file);
  }

  removeSnapshot(): void {
    this.snapshotData = null;
    this.snapshotName = '';

    const input =
      document.getElementById(
        'snapshot'
      ) as HTMLInputElement | null;

    if (input) {
      input.value = '';
    }
  }

  createIncident(): void {
    this.submitted = true;
    this.errorMessage = '';

    if (!this.isFormValid()) {
      return;
    }

    this.loading = true;

    this.api.createIncident({
      title: this.incident.title.trim(),
      description:
        this.incident.description.trim(),
      priority: this.incident.priority,
      category: this.incident.category,
      snapshotData: this.snapshotData
    } as any).subscribe({
      next: (response) => {
        this.loading = false;

        const createdIncident =
          response?.incident;

        if (createdIncident?.id) {
          this.router.navigate([
            '/incidents',
            createdIncident.id
          ]);
        } else {
          this.router.navigate([
            '/incidents'
          ]);
        }
      },

      error: (error) => {
        this.loading = false;

        console.error(
          'CREATE INCIDENT ERROR:',
          error
        );

        this.errorMessage =
          error?.error?.message ||
          error?.error?.error ||
          'Unable to create incident. Please try again.';
      }
    });
  }

  isFormValid(): boolean {
    return (
      this.incident.title.trim().length > 0 &&
      this.incident.description.trim().length > 0 &&
      !!this.incident.priority &&
      !!this.incident.category
    );
  }

  cancel(): void {
    this.router.navigate([
      '/incidents'
    ]);
  }

  goDashboard(): void {
    this.router.navigate([
      '/dashboard'
    ]);
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate([
      '/login'
    ]);
  }
}