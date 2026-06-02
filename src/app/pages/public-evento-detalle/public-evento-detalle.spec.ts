import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PublicEventoDetalle } from './public-evento-detalle';

describe('PublicEventoDetalle', () => {
  let component: PublicEventoDetalle;
  let fixture: ComponentFixture<PublicEventoDetalle>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PublicEventoDetalle]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PublicEventoDetalle);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
