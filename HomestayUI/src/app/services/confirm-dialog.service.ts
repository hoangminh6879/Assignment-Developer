import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { filter, take, map } from 'rxjs/operators';

export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

interface ConfirmState {
  open: boolean;
  options: ConfirmOptions;
  resolve?: (val: boolean) => void;
}

@Injectable({ providedIn: 'root' })
export class ConfirmDialogService {
  private stateSubject = new BehaviorSubject<ConfirmState>({
    open: false,
    options: { message: '' }
  });
  state$ = this.stateSubject.asObservable();

  confirm(options: ConfirmOptions): Promise<boolean> {
    return new Promise(resolve => {
      this.stateSubject.next({ open: true, options, resolve });
    });
  }

  respond(result: boolean) {
    const current = this.stateSubject.value;
    if (current.resolve) current.resolve(result);
    this.stateSubject.next({ open: false, options: { message: '' } });
  }
}
