import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService, Toast } from '../../services/notification.service';
import { ConfirmDialogService } from '../../services/confirm-dialog.service';

@Component({
  selector: 'app-ui-overlays',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ui-overlays.component.html',
  styleUrl: './ui-overlays.component.css'
})
export class UiOverlaysComponent implements OnInit {
  toasts: Toast[] = [];
  confirmState$;

  constructor(
    public notification: NotificationService,
    public confirm: ConfirmDialogService
  ) {
    this.confirmState$ = this.confirm.state$;
  }

  ngOnInit() {
    this.notification.toasts$.subscribe(toasts => this.toasts = toasts);
  }
}
