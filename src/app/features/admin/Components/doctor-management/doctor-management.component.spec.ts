import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DoctorManagementComponent } from './doctor-management.component';

describe('DoctorManagementComponent', () => {
  let component: DoctorManagementComponent;
  let fixture: ComponentFixture<DoctorManagementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DoctorManagementComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DoctorManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
