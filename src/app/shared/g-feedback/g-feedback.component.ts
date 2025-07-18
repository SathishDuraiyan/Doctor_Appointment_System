import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
@Component({
  selector: 'app-g-feedback',
  standalone: true,
  imports: [FormsModule,CommonModule],
  templateUrl: './g-feedback.component.html',
  styleUrl: './g-feedback.component.css'
})
export class GFeedbackComponent {
  name: string = '';
  email: string = '';
  message: string = '';
  submitted: boolean = false;

  get wordCount(): number {
    return this.message.trim().split(/\s+/).filter(word => word).length;
  }

  submitForm() {
    if (this.name && this.email && this.message && this.wordCount <= 100) {
      this.submitted = true;

      console.log('Submitted:', { name: this.name, email: this.email, message: this.message });

      this.name = '';
      this.email = '';
      this.message = '';

    }
  }

  closeModal() {
    this.submitted = false;
  }
}
