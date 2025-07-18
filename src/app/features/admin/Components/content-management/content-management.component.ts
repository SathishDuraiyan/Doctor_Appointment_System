import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Banner {
  id: number;
  imageUrl: string;
  title: string;
  subtitle: string;
  description: string;
  buttonText: string;
  buttonLink: string;
  order: number;
  status: 'active' | 'inactive';
}

interface LegacyItem {
  icon: string;
  title: string;
  description: string;
}

interface SpecialtyItem {
  icon: string;
  title: string;
  description: string;
}

interface HomepageContent {
  about: {
    title: string;
    content: string;
  };
  legacy: {
    title: string;
    items: LegacyItem[];
  };
  specialties: {
    title: string;
    intro: string;
    items: SpecialtyItem[];
  };
  findDoctor: {
    title: string;
    subtitle: string;
    description: string;
    buttonText: string;
  };
  feedback: {
    imageUrl: string;
  };
}

@Component({
  selector: 'app-content-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './content-management.component.html',
  styleUrls: ['./content-management.component.css']
})
export class ContentManagementComponent implements OnInit {
  activeSection: string = 'banners';
  banners: Banner[] = [];
  homepageContent: HomepageContent;
  bannerForm: FormGroup;
  isBannerFormVisible = false;
  isContentEditorVisible = false;
  currentEditingSection = '';
  emergencyPhone = '999-999-1234';
  hospitalAddress = '123, Main Street, Coimbatore, India, PIN-641001';
  today = new Date();

  constructor(private fb: FormBuilder) {
    this.bannerForm = this.fb.group({
      id: [null],
      title: ['', Validators.required],
      subtitle: ['', Validators.required],
      description: ['', Validators.required],
      buttonText: [''],
      buttonLink: [''],
      order: [1, [Validators.required, Validators.min(1)]],
      status: ['active', Validators.required],
      imageUrl: ['', Validators.required]
    });

    // Make document available to the template
    (this as any).document = document;

    // Initialize with sample data (in a real app, this would come from a service)
    this.banners = [
      {
        id: 1,
        imageUrl: '/assets/banner-1.jpg',
        title: 'Experience Unmatched Excellence at StreamHawkX Hospital',
        subtitle: "India's Premier Medical Destination",
        description: 'Discover world-class healthcare services and compassionate care in the heart of Coimbatore. Our dedicated team of specialists ensures every patient receives personalized attention and state-of-the-art treatment.',
        buttonText: 'Learn More',
        buttonLink: '#',
        order: 1,
        status: 'active'
      },
      {
        id: 2,
        imageUrl: '/assets/banner-2.jpg',
        title: 'Round-the-Clock Emergency Medical Services',
        subtitle: 'Immediate Assistance When Every Second Counts',
        description: 'Our responsive emergency care team is equipped to handle critical situations with speed and precision. Experience care that not only saves lives but also restores hope during urgent moments.',
        buttonText: 'Emergency Info',
        buttonLink: '#',
        order: 2,
        status: 'active'
      }
    ];

    this.homepageContent = {
      about: {
        title: 'ABOUT US',
        content: `StreamHawkX Hospital, located in the heart of Coimbatore, was established in the year 2000 by the Tamil Nadu Government Charitable Trust with the noble mission of providing specialized medical care for women and children. Over the years, this esteemed institution has evolved into a multispecialty healthcare center, offering a comprehensive range of medical services under one roof.

From its humble beginnings as a dedicated facility for maternal and pediatric care, StreamHawkX Hospital has expanded its expertise across multiple medical disciplines, ensuring high-quality treatment and compassionate healthcare for patients of all ages. The hospital is equipped with state-of-the-art medical technology, modern infrastructure, and a team of highly qualified doctors, surgeons, and healthcare professionals committed to delivering excellence in patient care.`
      },
      legacy: {
        title: 'A LEGACY OF TRUST, VALUE AND REPUTATION',
        items: [
          {
            icon: 'fas fa-history',
            title: '24+ Years of Service',
            description: 'Comprehensive healthcare and medical services provided to the Coimbatore community for over two decades'
          },
          {
            icon: 'fas fa-eye',
            title: '1+ Visionary',
            description: 'Focused on a mission to make healthcare accessible, affordable, and reliable to everyone'
          },
          {
            icon: 'fas fa-building',
            title: '32+ Departments',
            description: 'Comprehensive multidisciplinary healthcare with specialists across all major medical fields'
          }
        ]
      },
      specialties: {
        title: 'OUR SPECIALTIES',
        intro: 'StreamHawkX Hospital offers a wide range of specialties to meet all your healthcare needs. From advanced technology to leading experts in the medical industry where you get the best treatment every time. People from in and around Coimbatore are highly satisfied with the services offered at the best hospital in Coimbatore, the University-level StreamHawkX Hospital in Alipiri. Healthcare departments with modern pace have been added.',
        items: [
          {
            icon: 'fas fa-hands-helping',
            title: 'Critical Medicine',
            description: 'A specialty unit that provides intensive care to critically ill patients. Focuses on diagnosis, monitoring, and treatment of patients in critical condition.'
          },
          {
            icon: 'fas fa-heartbeat',
            title: 'Cardiology',
            description: 'An advanced cardiac center focused on heart health. The department offers comprehensive care for all cardiovascular conditions using state-of-the-art technology.'
          },
          {
            icon: 'fas fa-procedures',
            title: 'General Surgery',
            description: 'A surgical specialty that treats many types of conditions through surgical procedures. Includes operations on digestive tract, abdomen, breasts, and other organs.'
          }
        ]
      },
      findDoctor: {
        title: 'Avoid Hassles & Delays',
        subtitle: 'Have StreamHawk Online Service better and quicker!',
        description: 'Don\'t worry! Find your doctor online! Book as you wish with ease. We offer you a free channel to service, make your appointment now.',
        buttonText: 'Find Doctors'
      },
      feedback: {
        imageUrl: '/assets/feedback.jpg'
      }
    };
  }

  ngOnInit(): void {
    // Sort banners by display order
    this.sortBanners();
  }

  sortBanners(): void {
    this.banners.sort((a, b) => a.order - b.order);
  }

  showSection(section: string): void {
    this.activeSection = section;
  }

  addBanner(): void {
    this.bannerForm.reset({
      order: 1,
      status: 'active'
    });
    this.isBannerFormVisible = true;
  }

  editBanner(banner: Banner): void {
    this.bannerForm.patchValue(banner);
    this.isBannerFormVisible = true;
  }

  deleteBanner(id: number): void {
    if (confirm('Are you sure you want to delete this banner?')) {
      this.banners = this.banners.filter(b => b.id !== id);
    }
  }

  saveBanner(): void {
    if (this.bannerForm.invalid) return;

    const bannerData = this.bannerForm.value;

    if (bannerData.id) {
      // Update existing banner
      const index = this.banners.findIndex(b => b.id === bannerData.id);
      if (index !== -1) {
        this.banners[index] = bannerData;
      }
    } else {
      // Add new banner
      const newId = this.banners.length > 0 ? Math.max(...this.banners.map(b => b.id)) + 1 : 1;
      this.banners.push({ ...bannerData, id: newId });
    }

    this.sortBanners();
    this.isBannerFormVisible = false;
  }

  openContentEditor(section: string): void {
    this.currentEditingSection = section;
    this.isContentEditorVisible = true;
  }

  saveContent(): void {
    // In a real app, you would save to a backend service here
    this.isContentEditorVisible = false;
  }

  updateEmergencyContact(): void {
    // In a real app, you would save to a backend service here
    alert(`Emergency contact updated to: ${this.emergencyPhone}`);
  }

  updateHospitalAddress(): void {
    // In a real app, you would save to a backend service here
    alert(`Hospital address updated to: ${this.hospitalAddress}`);
  }

  onFileSelected(event: Event, type: string): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        if (type === 'feedback') {
          this.homepageContent.feedback.imageUrl = e.target.result;
        } else {
          this.bannerForm.patchValue({ imageUrl: e.target.result });
        }
      };
      reader.readAsDataURL(input.files[0]);
    }
  }

  triggerFileInput(id: string): void {
    const element = document.getElementById(id);
    if (element) {
      element.click();
    }
  }
}
