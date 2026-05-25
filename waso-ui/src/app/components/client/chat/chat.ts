import { Component, OnInit, OnDestroy, inject, signal, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common'; 
import { FormsModule } from '@angular/forms';
import { ChatService, ChatMessage } from '../../../core/services/chat';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.html',
  styleUrls: ['./chat.css']
})
export class Chat implements OnInit, OnDestroy {
  private chatService = inject(ChatService);
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID); 

  // Dashboard Configuration View Controls
  activeTab = signal<string>('chat');
  inquirySubmitted = signal<boolean>(false);

  // Form Model Properties (Direct 1:1 map with Django backend tables)
  eventType: string = '';
  eventDate: string = '';
  guestCount: number | null = null;
  colorPalette: string = '';
  specificDetails: string = '';
  budgetEstimate: number | null = null; 
  town: string = 'Yaoundé';             

  // Client Identity UI Binding Variable
  userEmail: string = ''; 

  // Live Sync Chat Logs
  messageLog = signal<any[]>([]); 
  newMessageText: string = '';    
  errorMessage = signal<string>(''); 
  
  private pollingIntervalId: any;

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      // Extract user identity directly from local storage profile tracking keys
      this.userEmail = localStorage.getItem('waso_user_email') || 'client@wasodeco.cm';

      this.fetchMessages();

      // Maintain background streaming synchronization loop
      this.pollingIntervalId = setInterval(() => {
        this.fetchMessages();
      }, 4000);
    }
  }

  private getAuthHeaders(): HttpHeaders {
    if (!isPlatformBrowser(this.platformId)) {
      return new HttpHeaders();
    }
    const token = localStorage.getItem('waso_access_token');
    return new HttpHeaders({
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }

  switchView(tabName: string) {
    this.activeTab.set(tabName);
  }

  fetchMessages() {
    this.chatService.getMessages().subscribe({
      next: (data: ChatMessage[]) => {
        const formattedLog = data.map(msg => ({
          id: msg.id,
          text: msg.message,
          sender: msg.is_from_staff ? 'manager' : 'client',
          timestamp: msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''
        }));
        
        this.messageLog.set(formattedLog);
        this.errorMessage.set('');
      },
      error: (err: any) => {
        console.error('Error syncing design channel records:', err);
        if (err.status !== 401) {
          this.errorMessage.set('Connection lost. Retrying to connect...');
        }
      }
    });
  }

  dispatchChatMessage() {
    const text = this.newMessageText.trim();
    if (!text) return;

    this.chatService.sendMessage(text).subscribe({
      next: (savedMsg: ChatMessage) => {
        const newBubble = {
          id: savedMsg.id,
          text: savedMsg.message,
          sender: 'client',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        
        this.messageLog.update((current) => [...current, newBubble]);
        this.newMessageText = ''; 
        this.errorMessage.set('');
      },
      error: (err: any) => {
        console.error('Failed to submit message payload:', err);
        this.errorMessage.set('Message could not be delivered.');
      }
    });
  }

  /**
   * Submits your custom event form variables to the backend automated creation view
   */
  sendInquiryForm() {
    let activeUserEmail = 'anonymous@wasodeco.cm';
    if (isPlatformBrowser(this.platformId)) {
      activeUserEmail = localStorage.getItem('waso_user_email') || 'anonymous@wasodeco.cm';
    }

    const enrichedNotes = this.specificDetails ? `Details: ${this.specificDetails}` : 'No additional structural details provided.';

    // Final clean, secure schema packet mapping 1:1 with models.py constraints
    const payload = {
      client_name: "Verified Client",
      client_email: activeUserEmail,
      event_date: this.eventDate,
      venue_name: this.eventType || 'Bespoke Setup', 
      town: this.town || 'Yaoundé',
      guest_count: Number(this.guestCount || 1),
      budget_estimate: Number(this.budgetEstimate || 0), 
      color_palette: this.colorPalette || 'Not Specified',
      status: "NEW", 
      notes: enrichedNotes
    };

    this.http.post(`${environment.apiUrl}/api/inquiries/`, payload, {
      headers: this.getAuthHeaders()
    }).subscribe({
      next: () => {
        this.inquirySubmitted.set(true);
        
        // Reset local bindings cleanly to protect state tracking grids
        this.eventType = '';
        this.eventDate = '';
        this.guestCount = null;
        this.colorPalette = '';
        this.specificDetails = '';
        this.budgetEstimate = null;
        this.town = 'Yaoundé';
        this.errorMessage.set('');
      },
      error: (err) => {
        console.error('Failed to register custom inquiry structure:', err);
        this.errorMessage.set('Could not transmit your inquiry parameters. Please confirm data values and try again.');
      }
    });
  }

  ngOnDestroy() {
    if (this.pollingIntervalId) {
      clearInterval(this.pollingIntervalId);
    }
  }
}