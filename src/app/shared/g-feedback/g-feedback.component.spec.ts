import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GFeedbackComponent } from './g-feedback.component';

describe('GFeedbackComponent', () => {
  let component: GFeedbackComponent;
  let fixture: ComponentFixture<GFeedbackComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GFeedbackComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GFeedbackComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
