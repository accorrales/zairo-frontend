import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Planillas } from './planillas';

describe('Planillas', () => {
  let component: Planillas;
  let fixture: ComponentFixture<Planillas>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Planillas]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Planillas);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
