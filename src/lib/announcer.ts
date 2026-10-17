// Arena AI Voice Announcer utilizing native Web Speech Synthesis API
const STORAGE_KEY = "ace_arena_voice_enabled";

class ArenaAnnouncer {
  private enabled: boolean = false;

  constructor() {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        // Default to false on first visit so audio does not auto-play unexpectedly
        this.enabled = saved === "true";
      } catch {
        this.enabled = false;
      }
    }
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public setEnabled(val: boolean): void {
    this.enabled = val;
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY, String(val));
      } catch {
        // ignore storage error
      }
    }
  }

  public speak(text: string): void {
    if (!this.enabled || typeof window === "undefined" || !("speechSynthesis" in window)) {
      return;
    }

    try {
      // Cancel previous utterance to avoid queuing delays
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05; // Slightly brisk for broadcast pace
      utterance.pitch = 1.02; // Crisp tone
      utterance.volume = 1.0;

      // Pick best English voice if available
      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find(
        (v) =>
          (v.lang.startsWith("en") && (v.name.includes("Google") || v.name.includes("Natural") || v.name.includes("Samantha")))
      );
      if (preferred) {
        utterance.voice = preferred;
      }

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn("Speech synthesis notice:", err);
    }
  }

  public announceLeadChange(teamName: string, score: number): void {
    this.speak(`Attention arena: ${teamName} has taken the lead with ${score.toFixed(1)} points!`);
  }

  public announceScoreSubmitted(teamName: string, score: number): void {
    this.speak(`Official score confirmed for ${teamName}. ${score.toFixed(1)} points awarded.`);
  }

  public announceTrialStart(teamName: string): void {
    this.speak(`Autonomous trial initiated for ${teamName}. Clock running.`);
  }

  public announceTrialEnd(teamName: string): void {
    this.speak(`Trial complete for ${teamName}. Commencing final score tabulation.`);
  }
}

export const announcer = new ArenaAnnouncer();
