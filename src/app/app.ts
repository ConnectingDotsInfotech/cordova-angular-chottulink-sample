import { AppRoutes } from './models/enums/app-routes.enum';
import { ChottuLinkService } from './services/chottulink.service';
import { Component, OnInit } from '@angular/core';
import { EventLogService } from './services/event-log.service';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  protected readonly AppRoutes = AppRoutes;

  constructor(
    private chottuLink: ChottuLinkService,
    protected eventLog: EventLogService
  ) {}

  ngOnInit(): void {
    this.chottuLink.initialize().then();
  }
}
