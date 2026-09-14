import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  OnInit
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  ActivatedRoute,
  Router
} from '@angular/router';
import { finalize } from 'rxjs';

import { Api } from '../../services/api';
import { Auth } from '../../services/auth';

@Component({
  selector: 'app-incident-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './incident-detail.html',
  styleUrl: './incident-detail.scss'
})
export class IncidentDetail implements OnInit {
  incidentId = 0;
  incident: any = null;
  comments: any[] = [];
  activity: any[] = [];
  users: any[] = [];

  loading = true;
  actionLoading = false;
  commentLoading = false;
  analysisLoading = false;
  agentLoading = false;
  assignmentLoading = false;

  errorMessage = '';
  commentText = '';

  aiAnalysis: any = null;
  agentResult: any = null;

  selectedStatus = '';
  selectedAssignee: number | null = null;

  constructor(
    private api: Api,
    private auth: Auth,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const id = Number(
      this.route.snapshot.paramMap.get('id')
    );

    console.log(
      'INCIDENT DETAIL INITIALIZED'
    );

    console.log(
      'ROUTE INCIDENT ID:',
      id
    );

    if (
      !Number.isInteger(id) ||
      id <= 0
    ) {
      this.errorMessage =
        'Invalid incident ID.';

      this.loading = false;

      this.cdr.detectChanges();

      return;
    }

    this.incidentId = id;

    this.loadIncident();
    this.loadComments();
    this.loadActivity();

    if (this.isAdmin()) {
      this.loadUsers();
    }
  }

  isAdmin(): boolean {
    const user = this.auth.getUser();

    return user?.role === 'ADMIN';
  }

  canUseAI(): boolean {
    const user = this.auth.getUser();

    return (
      user?.role === 'ADMIN' ||
      user?.role === 'AGENT'
    );
  }

  loadIncident(): void {
    if (!this.incidentId) {
      console.error(
        'Cannot load incident: invalid incident ID'
      );

      this.loading = false;
      this.errorMessage =
        'Invalid incident ID.';

      this.cdr.detectChanges();

      return;
    }

    console.log(
      'LOADING INCIDENT:',
      this.incidentId
    );

    this.loading = true;
    this.errorMessage = '';

    this.cdr.detectChanges();

    this.api
      .getIncident(this.incidentId)
      .pipe(
        finalize(() => {
          console.log(
            'INCIDENT REQUEST FINISHED'
          );

          this.loading = false;

          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (response: any) => {
          console.log(
            'INCIDENT API RESPONSE:',
            response
          );

          const incident =
            response?.incident ||
            response?.data ||
            response;

          if (
            !incident ||
            typeof incident !== 'object'
          ) {
            console.error(
              'Invalid incident response:',
              response
            );

            this.incident = null;

            this.errorMessage =
              'Incident data could not be read from the server.';

            this.cdr.detectChanges();

            return;
          }

          this.incident = incident;

          this.selectedStatus =
            this.incident.status ||
            'OPEN';

          this.selectedAssignee =
            this.incident.assignedTo != null
              ? Number(
                  this.incident.assignedTo
                )
              : null;

          console.log(
            'INCIDENT LOADED SUCCESSFULLY:',
            this.incident
          );

          this.cdr.detectChanges();
        },

        error: (error: any) => {
          console.error(
            'FAILED TO LOAD INCIDENT:',
            error
          );

          this.incident = null;

          this.errorMessage =
            error?.error?.message ||
            'Failed to load incident details.';

          this.cdr.detectChanges();
        }
      });
  }

  loadUsers(): void {
    if (!this.isAdmin()) {
      return;
    }

    this.api.getUsers().subscribe({
      next: (users: any[]) => {
        this.users =
          Array.isArray(users)
            ? users
            : [];

        this.cdr.detectChanges();
      },

      error: (error: any) => {
        console.error(
          'Failed to load users:',
          error
        );

        this.users = [];

        this.cdr.detectChanges();
      }
    });
  }

  assignIncident(): void {
    if (!this.isAdmin()) {
      return;
    }

    if (
      this.assignmentLoading ||
      !this.incidentId
    ) {
      return;
    }

    if (
      this.selectedAssignee == null
    ) {
      alert(
        'Please select a user to assign the incident.'
      );

      return;
    }

    this.assignmentLoading = true;

    this.api
      .assignIncident(
        this.incidentId,
        Number(
          this.selectedAssignee
        )
      )
      .subscribe({
        next: (response: any) => {
          this.assignmentLoading = false;

          this.incident =
            response?.incident ||
            response?.data ||
            response ||
            this.incident;

          this.selectedAssignee =
            this.incident?.assignedTo != null
              ? Number(
                  this.incident.assignedTo
                )
              : this.selectedAssignee;

          this.loadIncident();
          this.loadActivity();

          this.cdr.detectChanges();
        },

        error: (error: any) => {
          console.error(
            'Assignment failed:',
            error
          );

          this.assignmentLoading = false;

          alert(
            error?.error?.message ||
            'Failed to assign incident.'
          );

          this.cdr.detectChanges();
        }
      });
  }

  getAssignedUserName(
    assignedTo: number | null
  ): string {
    if (
      assignedTo == null ||
      assignedTo === undefined
    ) {
      return 'Unassigned';
    }

    const user =
      this.users.find(
        item =>
          Number(item.id) ===
          Number(assignedTo)
      );

    if (user) {
      return user.name;
    }

    return `User #${assignedTo}`;
  }

  updateStatus(): void {
    if (!this.isAdmin()) {
      return;
    }

    if (
      this.actionLoading ||
      !this.incidentId
    ) {
      return;
    }

    if (!this.selectedStatus) {
      alert(
        'Please select a status.'
      );

      return;
    }

    if (
      this.incident &&
      this.selectedStatus ===
        this.incident.status
    ) {
      return;
    }

    this.actionLoading = true;

    this.api
      .updateIncidentStatus(
        this.incidentId,
        this.selectedStatus
      )
      .subscribe({
        next: (response: any) => {
          this.actionLoading = false;

          this.incident =
            response?.incident ||
            response?.data ||
            response ||
            this.incident;

          this.loadIncident();
          this.loadActivity();

          this.cdr.detectChanges();
        },

        error: (error: any) => {
          console.error(
            'Status update failed:',
            error
          );

          this.actionLoading = false;

          alert(
            error?.error?.message ||
            'Failed to update incident status.'
          );

          this.cdr.detectChanges();
        }
      });
  }

  loadComments(): void {
    if (!this.incidentId) {
      return;
    }

    this.api
      .getComments(this.incidentId)
      .subscribe({
        next: (comments: any[]) => {
          this.comments =
            Array.isArray(comments)
              ? comments
              : [];

          this.cdr.detectChanges();
        },

        error: (error: any) => {
          console.error(
            'Failed to load comments:',
            error
          );

          this.comments = [];

          this.cdr.detectChanges();
        }
      });
  }

  addComment(): void {
    if (
      this.commentLoading ||
      !this.incidentId
    ) {
      return;
    }

    const comment =
      this.commentText.trim();

    if (!comment) {
      return;
    }

    this.commentLoading = true;

    this.api
      .addComment(
        this.incidentId,
        comment
      )
      .subscribe({
        next: () => {
          this.commentText = '';
          this.commentLoading = false;

          this.loadComments();
          this.loadActivity();

          this.cdr.detectChanges();
        },

        error: (error: any) => {
          console.error(
            'Failed to add comment:',
            error
          );

          this.commentLoading = false;

          alert(
            error?.error?.message ||
            'Failed to add comment.'
          );

          this.cdr.detectChanges();
        }
      });
  }

  loadActivity(): void {
    if (!this.incidentId) {
      return;
    }

    this.api
      .getActivity(this.incidentId)
      .subscribe({
        next: (activities: any[]) => {
          this.activity =
            Array.isArray(activities)
              ? activities
              : [];

          this.cdr.detectChanges();
        },

        error: (error: any) => {
          console.error(
            'Failed to load activity:',
            error
          );

          this.activity = [];

          this.cdr.detectChanges();
        }
      });
  }

  analyzeIncident(): void {
    if (!this.canUseAI()) {
      return;
    }

    if (
      this.analysisLoading ||
      !this.incidentId
    ) {
      return;
    }

    this.analysisLoading = true;

    this.api
      .analyzeIncident(this.incidentId)
      .subscribe({
        next: (response: any) => {
          console.log(
            'AI ANALYSIS RESPONSE:',
            response
          );

          /*
           * The backend returns:
           *
           * {
           *   success: true,
           *   incidentId: 7,
           *   analysis: {
           *     suggestedCategory,
           *     severity,
           *     confidence,
           *     summary,
           *     probableCause,
           *     recommendedActions,
           *     possibleResolution
           *   }
           * }
           */

          const analysis =
            response?.analysis;

          if (
            analysis &&
            typeof analysis === 'object'
          ) {
            this.aiAnalysis = {
              suggestedCategory:
                analysis.suggestedCategory,

              severity:
                analysis.severity,

              confidence:
                analysis.confidence,

              summary:
                analysis.summary,

              probableCause:
                analysis.probableCause,

              recommendedActions:
                Array.isArray(
                  analysis.recommendedActions
                )
                  ? analysis.recommendedActions
                  : [],

              possibleResolution:
                analysis.possibleResolution
            };
          } else {
            console.error(
              'Invalid AI analysis response:',
              response
            );

            this.aiAnalysis = null;
          }

          this.analysisLoading = false;

          this.loadActivity();

          this.cdr.detectChanges();
        },

        error: (error: any) => {
          console.error(
            'AI analysis failed:',
            error
          );

          this.analysisLoading = false;

          alert(
            error?.error?.message ||
            'AI analysis failed.'
          );

          this.cdr.detectChanges();
        }
      });
  }

  runAgent(): void {
    if (!this.canUseAI()) {
      return;
    }

    if (
      this.agentLoading ||
      !this.incidentId
    ) {
      return;
    }

    this.agentLoading = true;

    this.api
      .runAgent(this.incidentId)
      .subscribe({
        next: (response: any) => {
          console.log(
            'AI AGENT RESPONSE:',
            response
          );

          this.agentResult =
            response?.agent ||
            response?.data ||
            response;

          this.agentLoading = false;

          this.loadIncident();
          this.loadActivity();
          this.loadComments();

          this.cdr.detectChanges();
        },

        error: (error: any) => {
          console.error(
            'AI Agent failed:',
            error
          );

          this.agentLoading = false;

          alert(
            error?.error?.message ||
            'AI Agent execution failed.'
          );

          this.cdr.detectChanges();
        }
      });
  }

  getAnalysisCategory(): string {
    if (!this.aiAnalysis) {
      return '—';
    }

    const category =
      this.aiAnalysis.suggestedCategory ??
      this.aiAnalysis.category;

    if (
      !category ||
      typeof category !== 'string'
    ) {
      return '—';
    }

    return this.formatCategory(
      category
    );
  }

  getAnalysisSeverity(): string {
    if (!this.aiAnalysis) {
      return '—';
    }

    const severity =
      this.aiAnalysis.severity ??
      this.aiAnalysis.priority;

    if (
      !severity ||
      typeof severity !== 'string'
    ) {
      return '—';
    }

    return severity
      .toString()
      .replace(/_/g, ' ')
      .toUpperCase();
  }

  getAnalysisConfidence(): string {
    if (!this.aiAnalysis) {
      return '—';
    }

    const confidence =
      this.aiAnalysis.confidence ??
      this.aiAnalysis.confidenceScore ??
      this.aiAnalysis.score;

    if (
      typeof confidence !== 'number' ||
      !Number.isFinite(confidence)
    ) {
      return '—';
    }

    const percentage =
      confidence <= 1
        ? confidence * 100
        : confidence;

    return `${Math.round(
      percentage
    )}%`;
  }

  getAnalysisSummary(): string {
    if (!this.aiAnalysis) {
      return '—';
    }

    return (
      this.aiAnalysis.summary ||
      '—'
    );
  }

  getProbableCause(): string {
    if (!this.aiAnalysis) {
      return '—';
    }

    return (
      this.aiAnalysis.probableCause ||
      this.aiAnalysis.possibleCause ||
      this.aiAnalysis.possible_cause ||
      '—'
    );
  }

  getTroubleshootingSteps(): string[] {
    if (!this.aiAnalysis) {
      return [];
    }

    const steps =
      this.aiAnalysis.recommendedActions ??
      this.aiAnalysis.troubleshootingSteps ??
      this.aiAnalysis.troubleshooting_steps ??
      this.aiAnalysis.steps ??
      [];

    if (Array.isArray(steps)) {
      return steps
        .map((step: any) =>
          String(step)
        )
        .filter(
          (step: string) =>
            step.trim().length > 0
        );
    }

    if (typeof steps === 'string') {
      return steps
        .split(/\r?\n/)
        .map(step =>
          step
            .replace(
              /^\s*(?:[-*•]|\d+[.)])\s*/,
              ''
            )
            .trim()
        )
        .filter(
          step =>
            step.length > 0
        );
    }

    return [];
  }

  getPossibleResolution(): string {
    if (!this.aiAnalysis) {
      return '—';
    }

    return (
      this.aiAnalysis.possibleResolution ||
      this.aiAnalysis.possible_resolution ||
      this.aiAnalysis.recommendedResolution ||
      '—'
    );
  }

  getSeverityClass(
    severity: string | undefined
  ): string {
    if (!severity) {
      return '';
    }

    const value =
      severity
        .toString()
        .toLowerCase()
        .trim();

    if (
      value.includes('critical') ||
      value === 'p1'
    ) {
      return 'severity-critical';
    }

    if (
      value.includes('high') ||
      value === 'p2'
    ) {
      return 'severity-high';
    }

    if (
      value.includes('medium') ||
      value === 'p3'
    ) {
      return 'severity-medium';
    }

    if (
      value.includes('low') ||
      value === 'p4'
    ) {
      return 'severity-low';
    }

    return '';
  }

  getPriorityClass(
    priority: string
  ): string {
    switch (
      priority?.toUpperCase()
    ) {
      case 'P1':
        return 'priority-p1';

      case 'P2':
        return 'priority-p2';

      case 'P3':
        return 'priority-p3';

      case 'P4':
        return 'priority-p4';

      default:
        return 'priority-p4';
    }
  }

  getStatusClass(
    status: string
  ): string {
    switch (
      status?.toUpperCase()
    ) {
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
        return 'status-closed';
    }
  }

  formatStatus(
    status: string
  ): string {
    if (!status) {
      return 'Unknown';
    }

    switch (
      status.toUpperCase()
    ) {
      case 'OPEN':
        return 'Open';

      case 'IN_PROGRESS':
        return 'In Progress';

      case 'RESOLVED':
        return 'Resolved';

      case 'CLOSED':
        return 'Closed';

      case 'REOPENED':
        return 'Reopened';

      default:
        return status;
    }
  }

  formatCategory(
    category: string
  ): string {
    if (!category) {
      return '—';
    }

    return category
      .toString()
      .replace(
        /_/g,
        ' '
      )
      .toLowerCase()
      .replace(
        /\b\w/g,
        character =>
          character.toUpperCase()
      );
  }

  formatActivityType(
    eventType: string
  ): string {
    if (!eventType) {
      return 'Activity';
    }

    switch (
      eventType.toUpperCase()
    ) {
      case 'INCIDENT_CREATED':
        return 'Incident Created';

      case 'STATUS_CHANGED':
        return 'Status Changed';

      case 'INCIDENT_STATUS_UPDATED':
        return 'Status Updated';

      case 'INCIDENT_ASSIGNED':
        return 'Incident Assigned';

      case 'COMMENT_ADDED':
        return 'Comment Added';

      case 'AI_ANALYSIS':
        return 'AI Analysis';

      case 'AI_AGENT_RUN':
        return 'AI Agent Run';

      default:
        return eventType
          .replace(
            /_/g,
            ' '
          )
          .toLowerCase()
          .replace(
            /\b\w/g,
            character =>
              character.toUpperCase()
          );
    }
  }

  formatActivityMetadata(
    metadata: any
  ): string {
    if (
      metadata === null ||
      metadata === undefined
    ) {
      return 'Action recorded.';
    }

    if (
      typeof metadata === 'string'
    ) {
      return metadata;
    }

    if (
      typeof metadata !== 'object'
    ) {
      return String(metadata);
    }

    if (
      metadata.fromStatus &&
      metadata.toStatus
    ) {
      return (
        `Status changed from ` +
        `${this.formatStatus(
          metadata.fromStatus
        )} ` +
        `to ` +
        `${this.formatStatus(
          metadata.toStatus
        )}.`
      );
    }

    if (
      metadata.assignedTo !== undefined
    ) {
      return (
        `Incident assigned to user #` +
        `${metadata.assignedTo}.`
      );
    }

    if (
      metadata.incidentNumber
    ) {
      return (
        `Incident ${metadata.incidentNumber} was created.`
      );
    }

    if (
      metadata.reason &&
      metadata.confidence !== undefined
    ) {
      const confidence =
        typeof metadata.confidence ===
        'number'
          ? `${Math.round(
              metadata.confidence * 100
            )}%`
          : String(
              metadata.confidence
            );

      return (
        `AI Agent decision: ` +
        `${metadata.action || 'REVIEW_ONLY'}. ` +
        `Confidence: ${confidence}. ` +
        `${metadata.reason}`
      );
    }

    if (
      metadata.commentText
    ) {
      return metadata.commentText;
    }

    const entries =
      Object.entries(
        metadata
      ).filter(
        ([, value]) =>
          value !== null &&
          value !== undefined &&
          typeof value !== 'object'
      );

    if (!entries.length) {
      return 'Action recorded.';
    }

    return entries
      .map(
        ([key, value]) =>
          `${this.formatMetadataKey(
            key
          )}: ${value}`
      )
      .join(' • ');
  }

  private formatMetadataKey(
    key: string
  ): string {
    return key
      .replace(
        /([A-Z])/g,
        ' $1'
      )
      .replace(
        /_/g,
        ' '
      )
      .trim()
      .toLowerCase()
      .replace(
        /\b\w/g,
        character =>
          character.toUpperCase()
      );
  }

  getInitials(
    name: string
  ): string {
    if (!name) {
      return 'U';
    }

    const parts =
      name
        .trim()
        .split(/\s+/)
        .filter(Boolean);

    if (!parts.length) {
      return 'U';
    }

    if (parts.length === 1) {
      return parts[0]
        .substring(0, 2)
        .toUpperCase();
    }

    return (
      parts[0].charAt(0) +
      parts[
        parts.length - 1
      ].charAt(0)
    ).toUpperCase();
  }

  goBack(): void {
    this.router.navigate([
      '/incidents'
    ]);
  }

  logout(): void {
    this.auth.logout();
  }
}