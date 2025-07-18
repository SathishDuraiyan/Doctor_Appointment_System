import { Component } from '@angular/core';

@Component({
  selector: 'app-department-card',
  imports: [],
  templateUrl: './department-card.component.html',
  styleUrls: ['./department-card.component.css']
})
export class DepartmentCardComponent {
  departments = [
    {
      id: 1,
      title: 'Critical Medicine',
      description: 'Our intensive care unit provides 24/7 monitoring and treatment for critically ill patients with state-of-the-art equipment and specialized medical team.',
      iconClass: 'fas fa-hands-helping',
      gradientFrom: 'from-teal-600',
      gradientTo: 'to-teal-700',
      hoverColor: 'hover:bg-teal-600',
      textColor: 'text-teal-600',
      secondaryIcon: 'fas fa-heartbeat'
    },
    {
      id: 2,
      title: 'Cardiology',
      description: 'Advanced cardiac care center offering comprehensive heart health services including diagnostics, treatment, and preventive care using cutting-edge technology.',
      iconClass: 'fas fa-heartbeat',
      gradientFrom: 'from-teal-600',
      gradientTo: 'to-teal-700',
      hoverColor: 'hover:bg-teal-600',
      textColor: 'text-teal-600',
      secondaryIcon: 'fas fa-heart'
    },
    {
      id: 3,
      title: 'General Surgery',
      description: 'Comprehensive surgical services including minimally invasive procedures, advanced laparoscopic surgery, and specialized operations with experienced surgeons.',
      iconClass: 'fas fa-procedures',
      gradientFrom: 'from-teal-600',
      gradientTo: 'to-teal-700',
      hoverColor: 'hover:bg-teal-600',
      textColor: 'text-teal-600',
      secondaryIcon: 'fas fa-surgical-tools'
    },
    {
      id: 4,
      title: 'Pediatrics',
      description: 'Specialized healthcare for infants, children, and adolescents with child-friendly environment and pediatric specialists dedicated to young patients.',
      iconClass: 'fas fa-baby',
      gradientFrom: 'from-teal-600',
      gradientTo: 'to-teal-700',
      hoverColor: 'hover:bg-teal-600',
      textColor: 'text-teal-600',
      secondaryIcon: 'fas fa-child'
    },
    {
      id: 5,
      title: 'Gynecology',
      description: 'Comprehensive women\'s health services including obstetrics, gynecology, and maternal care with experienced female specialists and modern facilities.',
      iconClass: 'fas fa-female',
      gradientFrom: 'from-teal-600',
      gradientTo: 'to-teal-700',
      hoverColor: 'hover:bg-teal-600',
      textColor: 'text-teal-600',
      secondaryIcon: 'fas fa-venus'
    },
    {
      id: 6,
      title: 'Ophthalmology',
      description: 'Advanced eye care services including cataract surgery, retinal treatments, and comprehensive vision care with state-of-the-art diagnostic equipment.',
      iconClass: 'fas fa-eye',
      gradientFrom: 'from-teal-600',
      gradientTo: 'to-teal-700',
      hoverColor: 'hover:bg-teal-600',
      textColor: 'text-teal-600',
      secondaryIcon: 'fas fa-glasses'
    }
  ];
}
