import { AfterViewInit, Directive, ElementRef, EventEmitter, HostListener, OnDestroy, Output, Input, inject } from '@angular/core';

/** Focus and visible viewport handling for a scrollable dialog; no form rules. */
@Directive({ selector: '[zairoDialog]', standalone: true })
export class DialogAccessibility implements AfterViewInit, OnDestroy {
  @Input() dialogInitialFocus = 'input';
  @Output() dialogClose = new EventEmitter<void>();
  private host = inject<ElementRef<HTMLElement>>(ElementRef);
  private previous = document.activeElement as HTMLElement | null;
  private oldOverflow = document.body.style.overflow;
  private viewport = window.visualViewport;
  private timer?: ReturnType<typeof setTimeout>;
  private resize = () => {
    if (!this.viewport) return;
    this.host.nativeElement.style.height = `${this.viewport.height}px`;
    this.host.nativeElement.style.top = `${this.viewport.offsetTop}px`;
  };

  ngAfterViewInit() {
    document.body.style.overflow = 'hidden';
    this.resize();
    this.viewport?.addEventListener('resize', this.resize);
    this.viewport?.addEventListener('scroll', this.resize);
    this.timer = setTimeout(() => this.host.nativeElement.querySelector<HTMLElement>(this.dialogInitialFocus)?.focus());
  }

  @HostListener('keydown', ['$event'])
  keyboard(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.dialogClose.emit();
    }
    if (event.key !== 'Tab') return;
    const items = [...this.host.nativeElement.querySelectorAll<HTMLElement>('button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),summary,a[href]')].filter(e => e.getClientRects().length > 0);
    const first = items[0], last = items.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  }

  ngOnDestroy() {
    clearTimeout(this.timer);
    this.viewport?.removeEventListener('resize', this.resize);
    this.viewport?.removeEventListener('scroll', this.resize);
    document.body.style.overflow = this.oldOverflow;
    if (this.previous?.isConnected) this.previous.focus();
  }
}
