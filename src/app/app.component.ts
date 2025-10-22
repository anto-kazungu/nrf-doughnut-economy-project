import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common'; 
// FINAL FIX: Removing the relative path './' and the '.ts' extension. 
// This forces the compiler to resolve the imported component names directly.
import { DashboardComponent } from './pages/dashboard/dashboard.component'; 
import { AboutProjectComponent } from './pages/about-project/about-project.component';
import { MetricsComponent } from './pages/metrics/metrics.component';

// Define the available views using a type union
type View = 'dashboard' | 'about' | 'metrics';

@Component({
  selector: 'app-root',
  templateUrl:'./app.component.html',
  styles: [`
    :host {
      display: block;
      min-height: 100vh;
    }
  `],
  standalone: true,
  imports: [CommonModule, DashboardComponent, AboutProjectComponent, MetricsComponent], 
})
export class AppComponent {
 // Signal to manage which component is currently visible
  public currentView = signal<View>('dashboard');

  /**
   * Updates the current view based on an event emitted by a child component.
   * @param newView The name of the view to switch to.
   */
  handleViewChange(newView: View) {
    this.currentView.set(newView);
    console.log('Switching view to:', newView);
  }
}
