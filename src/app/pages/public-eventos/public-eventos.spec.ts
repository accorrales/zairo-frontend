import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PublicEventos } from './public-eventos';

describe('PublicEventos', () => {
  let component: PublicEventos;
  let fixture: ComponentFixture<PublicEventos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PublicEventos]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PublicEventos);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
