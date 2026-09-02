/**
 * Audio helper for UI triggers, authentic Fireworks sound playback, and soundtrack synchronization
 */

class WeddingAudioManager {
  private fireworkAudio: HTMLAudioElement | null = null;
  private isPlaying: boolean = false;
  private isMuted: boolean = false;
  private listeners: Array<(playing: boolean, muted: boolean) => void> = [];

  /**
   * Plays the custom fireworks sound effect from Dragon Studio
   */
  public playFireworkShow() {
    try {
      if (typeof window !== 'undefined') {
        if (!this.fireworkAudio) {
          this.fireworkAudio = new Audio('/audio/fireworks.mp3');
          this.fireworkAudio.volume = 0.85;
        } else {
          this.fireworkAudio.currentTime = 0;
        }
        
        const playPromise = this.fireworkAudio.play();
        if (playPromise !== undefined) {
          playPromise.catch(err => {
            console.warn('Firework audio autoplay blocked or interrupted:', err);
          });
        }
      }
    } catch (e) {
      console.warn('Firework audio error:', e);
    }
  }

  public startMusic() {
    this.isPlaying = true;
    this.isMuted = false;
    this.notifyListeners();
  }

  public stopMusic() {
    this.isPlaying = false;
    this.notifyListeners();
  }

  public toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.fireworkAudio) {
      this.fireworkAudio.muted = this.isMuted;
    }
    this.notifyListeners();
  }

  public subscribe(listener: (playing: boolean, muted: boolean) => void) {
    this.listeners.push(listener);
    listener(this.isPlaying, this.isMuted);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(l => l(this.isPlaying, this.isMuted));
  }
}

export const weddingAudio = new WeddingAudioManager();
