import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent {
isMobileMenuOpen = false;


  sections = [
    { id: 'home', title: 'Home' },
    { id: 'about', title: 'About Us' },
    { id: 'services', title: 'Services' },
    { id: 'departments', title: 'Departments' },
    { id: 'contact', title: 'Contact Us' }
  ];
  constructor() { }
  ngOnInit(): void {
    // Initialize any necessary data or state here
  }
  ngOnDestroy(): void {
    // Clean up any subscriptions or resources here if necessary
  }

  isSectionActive(section: string): boolean {
    const currentSection = document.querySelector('.active');
    if (currentSection) {
      currentSection.classList.remove('active');
    }
    const element = document.getElementById(section);
    if (element && element.getBoundingClientRect().top < window.innerHeight / 2) {
      element.classList.add('active');
      return true;
    }
    return false;
  }

  isSectionVisible(section: string): boolean {
    const element = document.getElementById(section);
    return element ? element.getBoundingClientRect().top < window.innerHeight : false;
  }

  isSectionInViewport(section: string): boolean {
    const element = document.getElementById(section);
    if (!element) return false;

    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  }
  

  navigateTo(section: string): void {
    const element = document.getElementById(section);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      this.isMobileMenuOpen = false;
    }
  }




  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }
}
