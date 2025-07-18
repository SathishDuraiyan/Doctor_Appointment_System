import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Location } from '@angular/common';

@Component({
  selector: 'app-help-center',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './help-center.component.html',
  styleUrl: './help-center.component.css'
})
export class HelpCenterComponent {
  activeSection: string = 'dashboard-help';
  expandedFaqIndex: number | null = null;
  currentDate: string = new Date().toLocaleDateString();

  faqs = [
    {
      question: "How do I register as a new user?",
      answer: "Click on the 'Register' button on the login page and fill out the required information including your personal details and role selection."
    },
    {
      question: "What should I do if I forget my password?",
      answer: "Use the 'Forgot Password' link on the login page to reset your password via email verification."
    },
    {
      question: "How do I update my profile information?",
      answer: "Navigate to your profile section in the dashboard and click 'Edit Profile' to update your information."
    },
    {
      question: "How can I view my appointment history?",
      answer: "Go to the 'Appointments' section in your dashboard to view all past and upcoming appointments."
    },
    {
      question: "How do I contact technical support?",
      answer: "Use the contact form below or email us directly at support@doctormanagement.com for technical assistance."
    }
  ];

  sections = [
    { id: 'overview', title: 'Overview', icon: 'fas fa-home' },
    { id: 'getting-started', title: 'Getting Started', icon: 'fas fa-play-circle' },
    { id: 'user-management', title: 'User Management', icon: 'fas fa-users' },
    { id: 'appointments', title: 'Appointments', icon: 'fas fa-calendar-alt' },
    { id: 'reports', title: 'Reports', icon: 'fas fa-chart-bar' },
    { id: 'troubleshooting', title: 'Troubleshooting', icon: 'fas fa-tools' },
    { id: 'faq', title: 'FAQ', icon: 'fas fa-question-circle' },
    { id: 'contact', title: 'Contact Support', icon: 'fas fa-envelope' }
  ];

  contactForm = {
    name: '',
    email: '',
    subject: '',
    message: ''
  };

  constructor(private location: Location) {}

  // Method to handle back navigation
  goBack(): void {
    this.location.back();
  }

  // Method to show help sections (used in template)
  showHelpSection(sectionId: string): void {
    this.activeSection = sectionId;
  }

  // Method to toggle FAQ answers (used in template)
  toggleFaqAnswer(event: Event): void {
    const questionElement = event.currentTarget as HTMLElement;
    const answerElement = questionElement.nextElementSibling as HTMLElement;
    
    if (answerElement) {
      answerElement.classList.toggle('hidden');
    }
  }

  setActiveSection(sectionId: string): void {
    this.activeSection = sectionId;
  }

  toggleFaq(index: number): void {
    this.expandedFaqIndex = this.expandedFaqIndex === index ? null : index;
  }

  isFaqExpanded(index: number): boolean {
    return this.expandedFaqIndex === index;
  }

  onSubmitContactForm(): void {
    if (this.isFormValid()) {
      // Simulate form submission
      console.log('Contact form submitted:', this.contactForm);
      alert('Thank you for your message! We will get back to you soon.');
      this.resetContactForm();
    } else {
      alert('Please fill in all required fields.');
    }
  }

  private isFormValid(): boolean {
    return !!(this.contactForm.name &&
              this.contactForm.email &&
              this.contactForm.subject &&
              this.contactForm.message);
  }

  private resetContactForm(): void {
    this.contactForm = {
      name: '',
      email: '',
      subject: '',
      message: ''
    };
  }
}
