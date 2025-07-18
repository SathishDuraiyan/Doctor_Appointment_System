import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HospitalSliderComponent } from './hospital-slider.component';

describe('HospitalSliderComponent', () => {
  let component: HospitalSliderComponent;
  let fixture: ComponentFixture<HospitalSliderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HospitalSliderComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HospitalSliderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
