import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

// importing my new layout components
import { Navbar } from './components/layout/navbar/navbar';
import { Footer } from './components/layout/footer/footer';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navbar, Footer],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('waso-ui');
}
