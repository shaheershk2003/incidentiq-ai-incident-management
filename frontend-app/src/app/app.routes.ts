import { Routes } from '@angular/router';

import { Login } from './pages/login/login';
import { Dashboard } from './pages/dashboard/dashboard';
import { Incidents } from './pages/incidents/incidents';
import { IncidentDetail } from './pages/incident-detail/incident-detail';
import { CreateIncident } from './pages/create-incident/create-incident';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },

  {
    path: 'login',
    component: Login
  },

  {
    path: 'dashboard',
    component: Dashboard
  },

  {
    path: 'incidents',
    component: Incidents
  },

  {
    path: 'incidents/create',
    component: CreateIncident
  },

  {
    path: 'incidents/:id',
    component: IncidentDetail
  },

  {
    path: '**',
    redirectTo: 'dashboard'
  }
];