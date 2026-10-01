import { ElementRef } from '@angular/core';
import { InfamousFilm, InfamousIntro } from './infamous-experience';

describe('INFAMOUS responsive media', () => {
  const originalMatchMedia = window.matchMedia;
  afterEach(() => {
    window.matchMedia = originalMatchMedia;
    vi.restoreAllMocks();
  });

  it('requests autoplay on a small screen without a desktop width requirement', () => {
    const match = vi.fn().mockReturnValue({ matches: false });
    window.matchMedia = match;
    const film = new InfamousFilm();
    film.ngOnInit();
    expect(film.playVideo).toBe(true);
    expect(match).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)');
  });

  it('keeps autoplay off when reduced motion is requested', () => {
    window.matchMedia = vi.fn().mockReturnValue({ matches: true });
    const film = new InfamousFilm();
    film.ngOnInit();
    expect(film.playVideo).toBe(false);
  });

  it('retries a browser-blocked video on a user gesture', async () => {
    const video = document.createElement('video');
    const play = vi.spyOn(video, 'play').mockResolvedValue();
    const film = new InfamousFilm();
    film.playVideo = true;
    film.film = new ElementRef(video);
    film.toggle();
    await Promise.resolve();
    expect(play).toHaveBeenCalledOnce();
    // The control reports playback only after the actual playing event.
    expect(film.playing).toBe(false);
  });

  it('pauses by removing the video and clearing the playing state', () => {
    const film = new InfamousFilm();
    film.playVideo = true;
    film.playing = true;
    film.toggle();
    expect(film.playVideo).toBe(false);
    expect(film.playing).toBe(false);
  });

  it('keeps the manual control usable after a rejected play promise', async () => {
    const video = document.createElement('video');
    vi.spyOn(video, 'play').mockRejectedValue(new Error('NotAllowedError'));
    const film = new InfamousFilm();
    film.film = new ElementRef(video);
    film.toggle();
    await Promise.resolve();
    expect(film.playing).toBe(false);
    expect(film.playVideo).toBe(true);
  });

  it('reloads an intro that failed and allows a manual retry', async () => {
    const video = document.createElement('video');
    const reload = vi.spyOn(video, 'load').mockImplementation(() => {});
    const play = vi.spyOn(video, 'play').mockResolvedValue();
    const intro = new InfamousIntro();
    intro.failed = true;
    intro.play(video);
    await Promise.resolve();
    expect(reload).toHaveBeenCalledOnce();
    expect(play).toHaveBeenCalledOnce();
    expect(intro.failed).toBe(false);
  });
});
