export class SpeechRecognitionHandler {
    constructor(app) {
        this.app = app;
        this.recognition = null;
        this.activeTextarea = null;
        this.isListening = false;
        this.initRecognition();
    }

    initRecognition() {
        try {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (!SpeechRecognition) {
                console.warn('Speech recognition not supported in this browser');
                return;
            }

            this.recognition = new SpeechRecognition();
            this.recognition.continuous = true;
            this.recognition.interimResults = true;
            this.recognition.lang = 'id-ID';

            this.recognition.onresult = (event) => {
                const transcript = Array.from(event.results)
                    .map(result => result[0])
                    .map(result => result.transcript)
                    .join('');

                if (this.activeTextarea) {
                    this.activeTextarea.value = transcript;
                }
            };

            this.recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                this.stopRecognition();
                this.app.utils.showAlert('Error dalam pengenalan suara: ' + event.error, 'danger');
            };

            this.recognition.onend = () => {
                if (this.isListening) {
                    this.recognition.start();
                }
            };

        } catch (error) {
            console.error('Error initializing speech recognition:', error);
            this.app.utils.showAlert('Gagal menginisialisasi pengenalan suara', 'danger');
        }
    }

    setupSpeechButtons() {
        document.querySelectorAll('textarea').forEach(textarea => {
            if (!textarea.parentNode.querySelector('.speech-btn-container')) {
                const container = document.createElement('div');
                container.className = 'speech-btn-container position-absolute';
                container.style.top = '10px';
                container.style.right = '10px';
                container.style.zIndex = '10';

                const button = document.createElement('button');
                button.className = 'btn btn-sm btn-outline-secondary speech-btn';
                button.innerHTML = '<i class="bi bi-mic"></i>';
                button.title = 'Mulai/Pause Speech-to-Text';
                button.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.toggleRecognition(textarea);
                });

                container.appendChild(button);
                textarea.parentNode.style.position = 'relative';
                textarea.parentNode.appendChild(container);
            }
        });
    }

    toggleRecognition(textarea) {
        if (!this.recognition) {
            this.app.utils.showAlert('Fitur pengenalan suara tidak didukung di browser Anda', 'warning');
            return;
        }

        if (this.isListening && this.activeTextarea === textarea) {
            this.stopRecognition();
            this.updateButtonState(textarea, false);
        } else {
            if (this.isListening) {
                this.stopRecognition();
            }
            this.startRecognition(textarea);
            this.updateButtonState(textarea, true);
        }
    }

    startRecognition(textarea) {
        try {
            this.activeTextarea = textarea;
            this.isListening = true;
            this.recognition.start();
            this.app.utils.showAlert('Mic aktif. Mulai berbicara sekarang.', 'info');
        } catch (error) {
            console.error('Error starting speech recognition:', error);
            this.isListening = false;
            this.app.utils.showAlert('Mic tidak aktif', 'danger');
        }
    }

    stopRecognition() {
        this.isListening = false;
        if (this.recognition) {
            this.recognition.stop();
        }
        this.activeTextarea = null;
    }

    updateButtonState(textarea, isListening) {
        const button = textarea.parentNode.querySelector('.speech-btn');
        if (button) {
            if (isListening) {
                button.classList.add('btn-danger');
                button.classList.remove('btn-outline-secondary');
                button.innerHTML = '<i class="bi bi-mic-mute"></i>';
            } else {
                button.classList.remove('btn-danger');
                button.classList.add('btn-outline-secondary');
                button.innerHTML = '<i class="bi bi-mic"></i>';
            }
        }
    }
}