import { Component, HostListener } from '@angular/core';
import { NavbarComponent } from '../../shared/navbar/navbar.component';
import { FooterComponent } from '../../shared/footer/footer.component';
import { DepartmentCardComponent } from '../../shared/department-card/department-card.component';
import { GFeedbackComponent } from '../../shared/g-feedback/g-feedback.component';
import { HospitalSliderComponent } from '../../hospital-slider/hospital-slider.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    NavbarComponent,
    FooterComponent,
    DepartmentCardComponent,
    GFeedbackComponent,
    HospitalSliderComponent
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
  isScrollButtonVisible = false;

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.isScrollButtonVisible = window.scrollY > 300;
  }

  scrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }
}
