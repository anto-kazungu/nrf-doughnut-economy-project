import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

type View = 'dashboard' | 'about' | 'metrics';

@Component({
  selector: 'app-about-project',
  imports: [CommonModule],
  standalone: true,
  templateUrl: './about-project.component.html',
  styleUrl: './about-project.component.css'
})
export class AboutProjectComponent {
    // Emits a request to the parent component to change the view
    @Output() viewChangeRequest = new EventEmitter<View>();
    

    goToDashboard() {
      this.viewChangeRequest.emit('dashboard');
    }

    goToMetrics() {
      this.viewChangeRequest.emit('metrics');
    }
}
