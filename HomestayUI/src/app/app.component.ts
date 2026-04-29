import { Component } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { UiOverlaysComponent } from './components/ui-overlays/ui-overlays.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, UiOverlaysComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'HomestayUI';
}
