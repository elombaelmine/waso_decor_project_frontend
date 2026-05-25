import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms'; 

interface GalleryItem {
  id: number;
  title: string;
  image: string;
  event_type: string;
  primary_color: string;
}

@Component({
  selector: 'app-gallery',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './gallery.html',
  styleUrl: './gallery.css'
})
export class Gallery implements OnInit {
  private http = inject(HttpClient);
  
  // Base raw array stream
  private readonly allGalleryItems = signal<GalleryItem[]>([]);
  
  // Filter Dropdown Trackers
  protected readonly selectedEventType = signal<string>('All');
  protected readonly selectedColor = signal<string>('All');

  // Interactive Popup State
  protected readonly selectedItem = signal<GalleryItem | null>(null);

  // Dynamic menu auto-generators
  protected readonly availableEventTypes = computed(() => {
    const types = this.allGalleryItems().map(item => item.event_type);
    return ['All', ...new Set(types)].sort();
  });

  protected readonly availableColors = computed(() => {
    const colors = this.allGalleryItems().map(item => item.primary_color);
    return ['All', ...new Set(colors)].sort();
  });

  // Dynamic grid matrix
  protected readonly filteredGalleryItems = computed(() => {
    const typeFilter = this.selectedEventType();
    const colorFilter = this.selectedColor();
    let items = this.allGalleryItems();

    if (typeFilter !== 'All') {
      items = items.filter(item => item.event_type === typeFilter);
    }
    if (colorFilter !== 'All') {
      items = items.filter(item => item.primary_color === colorFilter);
    }
    return items;
  });

  ngOnInit(): void {
    this.fetchAdminUploads();
  }

  private fetchAdminUploads(): void {
    this.http.get<GalleryItem[]>('https://waso-decor-project-backend.onrender.com/api/gallery/')
      .subscribe({
        next: (data) => this.allGalleryItems.set(data),
        error: (err) => console.error('Could not load entries:', err)
      });
  }

  // Action methods to engage the pop-up modal overlay
  protected openDetailModal(item: GalleryItem): void {
    this.selectedItem.set(item);
  }

  protected closeDetailModal(): void {
    this.selectedItem.set(null);
  }
}