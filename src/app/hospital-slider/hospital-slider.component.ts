// hospital-slider.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Slide {
  id: number;
  image: string;
  title: string;
  description: string;
  buttonText: string;
  alt: string;
}

@Component({
  selector: 'app-hospital-slider',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './hospital-slider.component.html',
  styleUrls: ['./hospital-slider.component.css']
})
export class HospitalSliderComponent implements OnInit, OnDestroy {
  currentSlide = 0;
  isLoading = true;
  private slideInterval: any;
  private readonly intervalDuration = 6000  ; // 6 seconds

  slides: Slide[] = [
    {
      id: 1,
      image: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80',
      title: 'Advanced Cardiac Care',
      description: 'Our state-of-the-art cardiac center provides comprehensive heart care with cutting-edge technology and world-class cardiologists dedicated to your heart health.',
      buttonText: 'Learn More',
      alt: 'Modern Hospital Cardiac Care Facility'
    },
    {
      id: 2,
      image: 'https://images.unsplash.com/photo-1581595219315-a187dd40c322?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80',
      title: 'Pediatric Excellence',
      description: 'Our pediatric specialists provide compassionate, family-centered care for children of all ages in a warm, child-friendly environment designed for healing.',
      buttonText: 'Our Services',
      alt: 'Pediatric Department with Child-Friendly Environment'
    },
    {
      id: 3,
      image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80',
      title: '24/7 Emergency Care',
      description: 'Our emergency department operates around the clock with trauma specialists and advanced life support systems ready to handle any medical emergency.',
      buttonText: 'Contact Us',
      alt: 'Emergency Department with Medical Equipment'
    },
    {
      id: 4,
      image: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80',
      title: 'Surgical Excellence',
      description: 'Our state-of-the-art operating rooms and experienced surgical teams deliver precision care using the latest minimally invasive techniques.',
      buttonText: 'View Procedures',
      alt: 'Modern Operating Room with Advanced Equipment'
    },
    {
      id: 5,
      image: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80',
      title: 'Diagnostic Imaging',
      description: 'Advanced MRI, CT, and ultrasound technology provides accurate diagnosis with our team of expert radiologists for comprehensive care.',
      buttonText: 'Book Scan',
      alt: 'Medical Imaging and Diagnostic Equipment'
    }
  ];

  ngOnInit(): void {
    // Simulate loading time
    setTimeout(() => {
      this.isLoading = false;
      this.startSlideTimer();
    }, 1000);
  }

  ngOnDestroy(): void {
    this.stopSlideTimer();
  }

  private startSlideTimer(): void {
    this.slideInterval = setInterval(() => {
      this.nextSlide();
    }, this.intervalDuration);
  }

  private stopSlideTimer(): void {
    if (this.slideInterval) {
      clearInterval(this.slideInterval);
      this.slideInterval = null;
    }
  }

  nextSlide(): void {
    this.currentSlide = (this.currentSlide + 1) % this.slides.length;
    this.resetTimer();
  }

  prevSlide(): void {
    this.currentSlide = (this.currentSlide - 1 + this.slides.length) % this.slides.length;
    this.resetTimer();
  }

  goToSlide(index: number): void {
    if (index >= 0 && index < this.slides.length) {
      this.currentSlide = index;
      this.resetTimer();
    }
  }

  private resetTimer(): void {
    this.stopSlideTimer();
    this.startSlideTimer();
  }

  // Method to add new slide
  addSlide(slide: Slide): void {
    this.slides.push(slide);
  }

  // Method to remove slide
  removeSlide(index: number): void {
    if (this.slides.length > 1 && index >= 0 && index < this.slides.length) {
      this.slides.splice(index, 1);
      if (this.currentSlide >= this.slides.length) {
        this.currentSlide = this.slides.length - 1;
      }
    }
  }
}
