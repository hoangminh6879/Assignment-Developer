import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { NavbarComponent } from '../../components/navbar/navbar.component';

@Component({
  selector: 'app-payment-result',
  standalone: true,
  imports: [CommonModule, NavbarComponent],
  templateUrl: './payment-result.component.html',
  styleUrl: './payment-result.component.css'
})
export class PaymentResultComponent implements OnInit {
  status: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.status = params['status'] || 'error';
    });
  }

  goToDashboard() {
    this.router.navigate(['/dashboard/user']);
  }

  goToHome() {
    this.router.navigate(['/']);
  }
}
