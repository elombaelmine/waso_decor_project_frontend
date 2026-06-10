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
  
  // Settings Properties
  profile = { fullName: '', email: '', phoneNumber: '', password: '' ,profile_pic: null,confirmPassword: ''};
  selectedFile: File | null = null;

  // Add this near your other variables (like selectedFile)
  previewUrl: string | null = null;

  // 2. Add visibility signal
  protected showPassword = signal<boolean>(false);
  protected showConfirmPassword = signal<boolean>(false);

// 3. Add toggle method
  protected toggleVisibility(field: 'pass' | 'confirm') {
    if (field === 'pass') this.showPassword.update(v => !v);
    else this.showConfirmPassword.update(v => !v);
  }

  // Client Identity UI Binding Variable
  userEmail: string = ''; 

  // Live Sync Chat Logs
  messageLog = signal<any[]>([]); 
  newMessageText: string = '';    
  errorMessage = signal<string>(''); 
  
  private pollingIntervalId: any;



 loadProfileData() {
  this.http.get(`${environment.apiUrl}/api/user/profile/`, { headers: this.getAuthHeaders() })
    .subscribe((data: any) => {
      this.profile.fullName = data.full_name; // Matches the serializer
      this.profile.phoneNumber = data.phone_number;
      this.profile.profile_pic = data.profile_pic;
    });
}

getInitials(fullName: string | undefined): string {
    if (!fullName) return 'WD'; 
    
    const parts = fullName.trim().split(' ');
    const initials = parts.length > 1 
      ? parts[0][0] + parts[parts.length - 1][0] 
      : parts[0][0];
      
    return initials.toUpperCase();
  }

  ngOnInit() {
  if (isPlatformBrowser(this.platformId)) {
    this.userEmail = localStorage.getItem('waso_user_email') || 'client@wasodeco.cm';
    this.profile.email = this.userEmail;
    this.loadProfileData(); // Clean call
    this.fetchMessages();
    this.pollingIntervalId = setInterval(() => this.fetchMessages(), 4000);
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
  if (tabName === 'settings') {
    this.loadProfileData(); // Fetch fresh data when user enters the tab
  }
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

 onFileSelected(event: any) {
  const file = event.target.files[0];
  if (file) {
    this.selectedFile = file;
    // Generate the URL once here and store it in the variable
    this.previewUrl = URL.createObjectURL(file);
  }
}

  // Replace your existing getPreviewUrl with this:
protected getPreviewUrl(file: File | null): string {
  return this.previewUrl || '';
}

  protected isSaving = signal<boolean>(false); // Add this at the top with other signals

protected saveProfileChanges() {
  if (this.isSaving()) return; 
  
  if (this.profile.password && this.profile.password !== this.profile.confirmPassword) {
    alert('Passwords do not match!');
    return;
  }

  this.isSaving.set(true); 
  
  const formData = new FormData();
  
  // REQUIRED: You must append all these fields to the formData
  formData.append('full_name', this.profile.fullName);
  formData.append('phone_number', this.profile.phoneNumber);
  
  if (this.profile.password) {
    formData.append('password', this.profile.password);
  }

  // Only append if a new image was selected
  if (this.selectedFile) {
    formData.append('profile_pic', this.selectedFile);
  }

  // Send the request
  this.http.put(`${environment.apiUrl}/api/user/profile/`, formData, {
    headers: this.getAuthHeaders() // Should contain ONLY Authorization header
  }).subscribe({
    next: (response: any) => {
      this.isSaving.set(false);
      alert('Profile updated successfully!');
      this.selectedFile = null;
      this.previewUrl = null; // Clear your preview
      this.loadProfileData(); // Refresh to show updated name/image
    },
    error: (err) => {
      this.isSaving.set(false);
      console.error('Update failed', err);
      // Helpful hint: check the console to see if the server returned a validation error
      alert('Error updating profile: ' + (err.error?.message || 'Check console for details'));
    }
  });
}

  ngOnDestroy() {
    if (this.pollingIntervalId) {
      clearInterval(this.pollingIntervalId);
    }
  }
}