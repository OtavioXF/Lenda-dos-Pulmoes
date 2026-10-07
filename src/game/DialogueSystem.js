export class DialogueSystem {
  constructor() {
    this.overlay = document.getElementById('dialogue-overlay');
    this.speakerNameEl = document.getElementById('dialogue-speaker-name');
    this.portraitEl = document.getElementById('dialogue-portrait');
    this.textEl = document.getElementById('dialogue-text-content');

    this.active = false;
    this.dialogueQueue = [];
    this.currentText = '';
    this.typedChars = 0;
    this.typeTimer = null;
    this.onCompleteCallback = null;
  }

  startDialogue(dialogueLines, onComplete, audio = null) {
    this.audioRef = audio;
    this.dialogueQueue = [...dialogueLines];
    this.onCompleteCallback = onComplete;
    this.active = true;
    this.overlay.classList.remove('hidden');
    this.nextNextLine();
  }

  nextNextLine() {
    if (this.dialogueQueue.length === 0) {
      this.closeDialogue();
      return;
    }

    const line = this.dialogueQueue.shift();
    this.speakerNameEl.innerText = line.speaker || 'Guia';
    this.portraitEl.innerText = line.portrait || '💬';

    this.currentText = line.text;
    this.typedChars = 0;
    this.textEl.innerText = '';

    if (this.typeTimer) clearInterval(this.typeTimer);

    // Typewriter effect
    this.typeTimer = setInterval(() => {
      this.typedChars++;
      this.textEl.innerText = this.currentText.substring(0, this.typedChars);

      if (this.audioRef) {
        this.audioRef.playTalkBlip();
      }

      if (this.typedChars >= this.currentText.length) {
        clearInterval(this.typeTimer);
        this.typeTimer = null;
      }
    }, 20);
  }

  advance() {
    if (!this.active) return;

    if (this.typedChars < this.currentText.length) {
      // Skip typewriter animation
      clearInterval(this.typeTimer);
      this.typedChars = this.currentText.length;
      this.textEl.innerText = this.currentText;
    } else {
      // Proceed to next line
      this.nextNextLine();
    }
  }

  closeDialogue() {
    this.active = false;
    this.overlay.classList.add('hidden');
    if (this.typeTimer) clearInterval(this.typeTimer);
    if (this.onCompleteCallback) {
      const cb = this.onCompleteCallback;
      this.onCompleteCallback = null;
      cb();
    }
  }
}
