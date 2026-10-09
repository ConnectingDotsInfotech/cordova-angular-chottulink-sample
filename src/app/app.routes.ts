import { AppRoutes } from './models/enums/app-routes.enum';
import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: AppRoutes.EVENTS, pathMatch: 'full' },
  {
    path: AppRoutes.EVENTS,
    loadComponent: () => import('./pages/events/events.component').then((c) => c.EventsComponent),
    data: { breadcrumb: 'Events' }
  },
  {
    path: AppRoutes.CREATE_LINK,
    loadComponent: () =>
      import('./pages/create-link/create-link.component').then((c) => c.CreateLinkComponent),
    data: { breadcrumb: 'Create link' }
  },
  {
    path: AppRoutes.ATTRIBUTION,
    loadComponent: () =>
      import('./pages/attribution/attribution.component').then((c) => c.AttributionComponent),
    data: { breadcrumb: 'Attribution' }
  }
];
