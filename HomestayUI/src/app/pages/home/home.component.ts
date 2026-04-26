import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../components/navbar/navbar.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, NavbarComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
  featuredHomestays = [
    { id: 1, name: 'Lumiere Retreat', city: 'Đà Lạt', price: 1200000, rating: 4.9, image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=600' },
    { id: 2, name: 'Ocean Whisper', city: 'Đà Nẵng', price: 850000, rating: 4.7, image: 'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fit=crop&q=80&w=600' },
    { id: 3, name: 'Green Valley', city: 'Sapa', price: 950000, rating: 4.8, image: 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&q=80&w=600' }
  ];
}
