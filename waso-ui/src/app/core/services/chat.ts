import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common'; // Adjusted path for standard common utils
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ChatMessage {
  id?: number;
  user?: number;
  sender_name: string;
  message: string;
  is_from_staff: boolean;
  created_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);
  private apiUrl = `${environment.apiUrl}/api/chat/`; 

  private getAuthHeaders(): HttpHeaders {
    // If we're on the server during pre-render, don't read localStorage
    if (!isPlatformBrowser(this.platformId)) {
      return new HttpHeaders();
    }
    const token = localStorage.getItem('waso_access_token');
    return new HttpHeaders({
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }

  getMessages(clientId?: number): Observable<ChatMessage[]> {
    let params = new HttpParams();
    if (clientId) {
      params = params.set('client_id', clientId.toString());
    }
    
    return this.http.get<ChatMessage[]>(this.apiUrl, { 
      headers: this.getAuthHeaders(),
      params 
    });
  }

  sendMessage(messageText: string, clientId?: number): Observable<ChatMessage> {
    const payload: any = { message: messageText };
    if (clientId) {
      payload.client_id = clientId;
    }
    
    return this.http.post<ChatMessage>(this.apiUrl, payload, {
      headers: this.getAuthHeaders()
    });
  }
}