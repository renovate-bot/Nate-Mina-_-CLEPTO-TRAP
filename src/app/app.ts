import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatChipsModule } from '@angular/material/chips';
import { GoogleGenAI, Type } from '@google/genai';

interface SecurityEvent {
  id: string;
  timestamp: Date;
  type: 'shoplifting' | 'fall' | 'suspicious' | 'normal';
  description: string;
  confidence: number;
  imageUrl: string;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-root',
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatToolbarModule,
    MatListModule,
    MatChipsModule,
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnDestroy {
  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasElement') canvasElement!: ElementRef<HTMLCanvasElement>;
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  isMonitoring = signal(false);
  events = signal<SecurityEvent[]>([]);
  latestEvent = computed(() => this.events()[0]);
  
  currentConfidence = signal<number>(0);
  currentStatus = signal<string>('normal');
  
  private stream: MediaStream | null = null;
  private monitorInterval: ReturnType<typeof setInterval> | null = null;
  private ai: GoogleGenAI;
  
  // Temporal analysis buffer
  private frameBuffer: string[] = [];
  private frameCount = 0;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  }

  ngOnDestroy() {
    this.stopMonitoring();
  }

  triggerFileInput() {
    this.fileInput.nativeElement.click();
  }

  async handleFileUpload(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    this.stopMonitoring();

    const url = URL.createObjectURL(file);
    if (this.videoElement?.nativeElement) {
      this.videoElement.nativeElement.srcObject = null;
      this.videoElement.nativeElement.src = url;
      this.videoElement.nativeElement.loop = true;
      await this.videoElement.nativeElement.play();
    }

    this.isMonitoring.set(true);
    // Capture 1 frame per second for temporal history
    this.monitorInterval = setInterval(() => this.captureAndBuffer(), 1000);
  }

  async toggleMonitoring() {
    if (this.isMonitoring()) {
      this.stopMonitoring();
    } else {
      await this.startMonitoring();
    }
  }

  private async startMonitoring() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      });
      
      if (this.videoElement?.nativeElement) {
        this.videoElement.nativeElement.srcObject = this.stream;
        this.videoElement.nativeElement.play();
      }

      this.isMonitoring.set(true);
      
      // Capture 1 frame per second
      this.monitorInterval = setInterval(() => this.captureAndBuffer(), 1000);
    } catch (err) {
      console.error('Error accessing camera:', err);
      alert('Could not access camera. Please ensure permissions are granted.');
    }
  }

  private stopMonitoring() {
    this.isMonitoring.set(false);
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    if (this.videoElement?.nativeElement) {
      this.videoElement.nativeElement.srcObject = null;
    }
    this.frameBuffer = [];
    this.frameCount = 0;
    this.currentConfidence.set(0);
    this.currentStatus.set('normal');
  }

  private captureAndBuffer() {
    if (!this.videoElement?.nativeElement || !this.canvasElement?.nativeElement) return;

    const video = this.videoElement.nativeElement;
    const canvas = this.canvasElement.nativeElement;
    
    if (video.videoWidth === 0 || video.videoHeight === 0) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Get base64 image (lower quality for batch sending)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
    const base64Data = dataUrl.split(',')[1];
    
    this.frameBuffer.push(base64Data);
    
    // Maintain max 5 frames (5 seconds of temporal history)
    if (this.frameBuffer.length > 5) {
      this.frameBuffer.shift();
    }
    
    this.frameCount++;
    
    // Trigger temporal AI analysis every 5 seconds if buffer is full
    if (this.frameCount % 5 === 0 && this.frameBuffer.length === 5) {
      this.analyzeTemporalSequence([...this.frameBuffer], dataUrl);
    }
  }

  private async analyzeTemporalSequence(frames: string[], lastFrameUrl: string) {
    try {
      const prompt = `You are Lexius, a production-grade behavioral AI system.
You are analyzing a temporal sequence of 5 frames from a retail security camera representing the last 5 seconds of footage (Temporal Action Recognition).
Lexius specifically differentiates itself by focusing on ACTIONS (gestures of concealment, hand-to-pocket, hand-to-bag) rather than biometrics. Privacy-First: DO NOT identify facial features. Focus ONLY on human skeletons, body mechanics, and hands.

Analyze the temporal sequence and classify the primary activity into one of the following categories:
1. 'shoplifting': Actively hiding unpaid merchandise over the sequence. Look for hands grabbing items and quickly moving them into clothing, bags, or strollers.
2. 'suspicious': Staging items, lingering in blind spots, or erratic body movements over the 5 seconds without confirmed concealment.
3. 'fall': A person collapsing or on the ground over the sequence.
4. 'normal': Customers brushing past, carrying items openly, looking at phones, or typical interactions.

CRITICAL: Evaluate the *sequence* of actions across the frames. For example, "Frame 1: reaching to shelf. Frame 3: placing item in coat pocket" equals shoplifting. "Holding an item throughout" equals normal.

Return a JSON object with 'type', 'description' (detailed explanation of the sequence of movements), and 'confidence' (number between 0 and 1).`;

      // Construct parts array for Gemini 1.5/3.0 to process multiple images
      const contentsArray: any[] = frames.map((b64, idx) => ({
        inlineData: {
          data: b64,
          mimeType: 'image/jpeg',
        }
      }));
      contentsArray.push(prompt);

      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: contentsArray,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              type: {
                type: Type.STRING,
                description: "The type of event detected."
              },
              description: {
                type: Type.STRING,
                description: "A brief description of the detected event."
              },
              confidence: {
                type: Type.NUMBER,
                description: "Confidence level of the detection, between 0 and 1."
              }
            },
            required: ['type', 'description', 'confidence']
          }
        }
      });

      const resultText = response.text;
      if (resultText) {
        const result = JSON.parse(resultText);
        
        this.currentStatus.set(result.type);
        this.currentConfidence.set(result.confidence);
        
        // Only log non-normal events or high confidence suspicious events
        if (result.type !== 'normal' && result.confidence > 0.65) {
          const newEvent: SecurityEvent = {
            id: Math.random().toString(36).substring(2, 9),
            timestamp: new Date(),
            type: result.type,
            description: result.description,
            confidence: result.confidence,
            imageUrl: lastFrameUrl // Keep last frame for the thumbnail
          };
          
          this.events.update(events => [newEvent, ...events].slice(0, 50));
        }
      }
    } catch (error) {
      console.error('Error analyzing temporal sequence:', error);
    }
  }
  
  getEventIcon(type: string): string {
    switch(type) {
      case 'shoplifting': return 'warning';
      case 'fall': return 'personal_injury';
      case 'suspicious': return 'visibility';
      default: return 'info';
    }
  }
  
  getEventColor(type: string): string {
    switch(type) {
      case 'shoplifting': return 'bg-red-100 text-red-800 border-red-200';
      case 'fall': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'suspicious': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }

  getConfidenceBarColor(type: string): string {
    switch(type) {
      case 'shoplifting': return 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.8)]';
      case 'fall': return 'bg-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.8)]';
      case 'suspicious': return 'bg-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.8)]';
      default: return 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]';
    }
  }

  getConfidenceTextColor(type: string): string {
    switch(type) {
      case 'shoplifting': return 'text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]';
      case 'fall': return 'text-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.8)]';
      case 'suspicious': return 'text-yellow-500 drop-shadow-[0_0_8px_rgba(234,179,8,0.8)]';
      default: return 'text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]';
    }
  }
}
