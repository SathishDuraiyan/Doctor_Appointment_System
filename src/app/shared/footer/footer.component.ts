import { Component } from '@angular/core';

@Component({
  selector: 'app-footer',
  imports: [],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.css'
})
export class FooterComponent {
  isMobileMenuOpen = false;
  sections = [
    { id: 'home', title: 'Home' },
    { id: 'about', title: 'About Us' },
    { id: 'services', title: 'Services' },
    { id: 'departments', title: 'Departments' },
    { id: 'contact', title: 'Contact Us' }
  ];

  navigateTo(section: string): void {
    const element = document.getElementById(section);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      this.isMobileMenuOpen = false;
    }
  }
}
