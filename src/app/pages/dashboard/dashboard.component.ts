
import { Component, EventEmitter, Output, signal, OnInit, computed } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';

// --- 1. Define TypeScript Interfaces for Database Structure ---
interface Scores { 
  social: number; 
  economic: number; 
  ecological: number; 
}
interface Achievements { 
  trees: number; 
  igas: number; 
  cleanups: number; 
}
export interface ImpactData { 
  year: number; 
  scores: Scores; 
  achievements: Achievements; 
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterOutlet, CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})


export class DashboardComponent implements OnInit {

  @Output() viewChangeRequest = new EventEmitter<'dashboard' | 'about' | 'metrics'>();

  // --- Data Signals ---
  public impactData = signal<ImpactData[]>([]);
  public isLoading = signal(true);
  
  // --- Automation Control ---
  public isAutomated = signal(true);
  private automationInterval: any;
  private readonly AUTOMATION_SPEED_MS = 3000; // Switch every 3 seconds

  // --- Year Tracking ---
  private currentYearIndex = signal(0);
  
  // --- Computed Metrics (Derived from impactData) ---
  private currentYearData = computed(() => {
    const data = this.impactData();
    if (data.length === 0) return null;
    return data[this.currentYearIndex()];
  });

  public currentYear = computed(() => this.currentYearData()?.year ?? '...');
  
  public nextYear = computed(() => {
      const data = this.impactData();
      if (data.length === 0 || data.length === 1) return 'Start Over';
      const nextIndex = (this.currentYearIndex() + 1) % data.length;
      return data[nextIndex].year;
  });

  // Core Scores
  private socialScore = computed(() => this.currentYearData()?.scores.social ?? 0);
  private economicScore = computed(() => this.currentYearData()?.scores.economic ?? 0);
  private ecologicalScore = computed(() => this.currentYearData()?.scores.ecological ?? 0);

  // Programmatic Achievements
  public treesPlanted = computed(() => this.currentYearData()?.achievements.trees ?? 0);
  public igaEstablished = computed(() => this.currentYearData()?.achievements.igas ?? 0);
  public cleanupsDone = computed(() => this.currentYearData()?.achievements.cleanups ?? 0);

  // --- Chart Configuration ---
  public labels = ['Social Impact', 'Economic Value', 'Ecological Health'];
  public colors = ['#0EA5E9', '#FACC15', '#84CC16']; 

  // SVG Calculation Parameters for Concentric Rings
  private readonly R_SOCIAL = 16;
  private readonly R_ECONOMIC = 32;
  private readonly R_ECOLOGICAL = 48;
  
  private readonly C_SOCIAL = 2 * Math.PI * this.R_SOCIAL;
  private readonly C_ECONOMIC = 2 * Math.PI * this.R_ECONOMIC;
  private readonly C_ECOLOGICAL = 2 * Math.PI * this.R_ECOLOGICAL;

  // Computed signal for the chart series data (used for the breakdown list)
  chartData = computed(() => [
    this.socialScore(), 
    this.economicScore(), 
    this.ecologicalScore()
  ]);
  
  // Computed signals for SVG stroke-dashoffset based on score
  socialOffset = computed(() => this.C_SOCIAL * (1 - this.socialScore() / 100));
  economicOffset = computed(() => this.C_ECONOMIC * (1 - this.economicScore() / 100));
  ecologicalOffset = computed(() => this.C_ECOLOGICAL * (1 - this.ecologicalScore() / 100));

  // Computed signal for the total score (average of the three, rounded)
  totalScore = computed(() => {
    const sum = this.socialScore() + this.economicScore() + this.ecologicalScore();
    const count = (this.socialScore() > 0 ? 1 : 0) + (this.economicScore() > 0 ? 1 : 0) + (this.ecologicalScore() > 0 ? 1 : 0);
    return count > 0 ? Math.round(sum / count) : 0;
  });
  
  /**
   * Simulates fetching data from a MongoDB API endpoint using exponential backoff retry.
   * This logic replaces the hardcoded data arrays.
   * @returns A promise that resolves to the ImpactData array.
   */
  private async fetchImpactData(retries: number = 3): Promise<ImpactData[]> {
    // --- Mock Data simulating MongoDB API response ---
    const mockData: ImpactData[] = [
      { year: 2021, scores: { social: 50, economic: 45, ecological: 58 }, achievements: { trees: 80000, igas: 8, cleanups: 50 } },
      { year: 2022, scores: { social: 55, economic: 50, ecological: 65 }, achievements: { trees: 150000, igas: 12, cleanups: 85 } },
      { year: 2023, scores: { social: 40, economic: 48, ecological: 61 }, achievements: { trees: 900000, igas: 12, cleanups: 100 } },
      { year: 2024, scores: { social: 50, economic: 60, ecological: 75 }, achievements: { trees: 250000, igas: 16, cleanups: 80 } },
      { year: 2025, scores: { social: 70, economic: 65, ecological: 80 }, achievements: { trees: 450000, igas: 20, cleanups: 150 } },
    ];
    // ----------------------------------------------------

    for (let i = 0; i < retries; i++) {
        try {
            // Simulate network delay and fetch
            await new Promise(resolve => setTimeout(resolve, i === 0 ? 1500 : 1000 * Math.pow(2, i))); 
            
            // In a real app, this would be: 
            // const response = await fetch('/api/impact-data');
            // if (!response.ok) throw new Error('Network response was not ok');
            // const data = await response.json();
            
            // Return mock data for this simulation
            console.log('Impact data fetched successfully.');
            return mockData;

        } catch (error) {
            console.error(`Attempt ${i + 1} failed to fetch data.`, error);
            if (i === retries - 1) {
                console.error("Failed to fetch data after all retries.");
                return []; // Return empty array on final failure
            }
        }
    }
    return []; // Should be unreachable if retries > 0
  }

  /**
   * Generates the SVG path 'd' attribute string for the line chart.
   * @param key The specific score key to plot ('social', 'economic', or 'ecological').
   * @returns A string formatted for the SVG path 'd' attribute (e.g., "M X1 Y1 L X2 Y2 ...").
   */
  public getLinePath(key: keyof Scores): string {
    const scores = this.impactData();
    if (scores.length === 0) return '';
    
    const chartHeight = 240; // Total height of the drawable area (270 - 30)
    const yAxisBase = 270;
    const xAxisStart = 50;
    const xStep = 107.5; // (480 - 50) / 4 data points (assuming 5 data points)

    let pathData = '';

    scores.forEach((data, index) => {
      const score = data.scores[key];
      const x = xAxisStart + index * xStep;
      // Y-coordinate calculation: 
      const y = yAxisBase - (score / 100) * chartHeight;

      if (index === 0) {
        pathData += `M ${x} ${y}`; // Move to starting point
      } else {
        pathData += ` L ${x} ${y}`; // Line to next point
      }
    });

    return pathData;
  }

  // --- Automation Functions ---

  private startAutomation() {
    if (this.automationInterval) return; // Already running
    this.isAutomated.set(true);
    this.automationInterval = setInterval(() => {
      this.goToNextYear(true); // Automated switch
    }, this.AUTOMATION_SPEED_MS);
  }

  private stopAutomation() {
    if (this.automationInterval) {
      clearInterval(this.automationInterval);
      this.automationInterval = null;
      this.isAutomated.set(false);
    }
  }

  public toggleAutomation() {
    if (this.isAutomated()) {
      this.stopAutomation();
    } else {
      this.startAutomation();
    }
  }

  /**
   * Advances the dashboard to the next year's data.
   * If called manually (isAutomatedCall=false), it stops the auto-play.
   */
  public goToNextYear(isAutomatedCall: boolean = false) {
    const data = this.impactData();
    if (data.length === 0) return; // Cannot step if no data
    
    if (!isAutomatedCall) {
      this.stopAutomation(); 
    }
    
    const nextIndex = (this.currentYearIndex() + 1) % data.length;
    this.currentYearIndex.set(nextIndex);
  }
  
  // --- Component Lifecycle ---
  async ngOnInit(): Promise<void> {
    this.isLoading.set(true);
    
    const data = await this.fetchImpactData();
    this.impactData.set(data);
    this.isLoading.set(false);
    
    // Start automation only after data is loaded and verified
    if (data.length > 0) {
        this.currentYearIndex.set(0);
        this.startAutomation();
    } else {
        this.stopAutomation();
    }
  }

  goToAbout(event: Event) {
    event.preventDefault(); // prevent the page reload
    this.viewChangeRequest.emit('about'); // 🔥 switch view
  }

  goToMetrics(event: Event) {
    event.preventDefault();
    this.viewChangeRequest.emit('metrics'); 
  }
}


