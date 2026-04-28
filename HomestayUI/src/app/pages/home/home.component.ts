import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { HomestayService, HomestayDto } from '../../services/homestay.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, NavbarComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {
  featuredHomestays: HomestayDto[] = [];

  constructor(private homestayService: HomestayService) {}

  ngOnInit() {
    this.homestayService.getActiveHomestays().subscribe({
      next: (data) => {
        this.featuredHomestays = data;
      },
      error: (err) => {
        console.error('Failed to load homestays', err);
      }
    });
  }
}
