export class SpeechRecognitionHandler {
    constructor(app) {
        this.app = app;
        this.recognition = null;
        this.activeTextarea = null;
        this.isListening = false;
        this.finalTranscript = ''; // ganti dari array ke string
        this.interimTranscript = '';
        this.stream = null;
        this.audioContext = null;
        this.scriptProcessor = null;
        this.socket = null;
        this.useWebSocket = false;
    }

    async initRecognition() {
        try {
            if ('webkitSpeechRecognition' in window) {
                this.recognition = new webkitSpeechRecognition();
                this.recognition.continuous = true;
                this.recognition.interimResults = true;
                this.recognition.lang = 'id-ID';

                this.recognition.onresult = (event) => {
                    let interimTranscript = '';

                    for (let i = event.resultIndex; i < event.results.length; i++) {
                        let transcript = event.results[i][0].transcript.trim().replace(/\s+/g, ' ');
                        if (event.results[i].isFinal) {
                            if (!this.finalTranscript.endsWith(transcript)) {
                                if (this.finalTranscript) this.finalTranscript += ' ';
                                this.finalTranscript += transcript;
                            }
                        } else {
                            interimTranscript += transcript + ' ';
                        }
                    }

                    this.interimTranscript = interimTranscript;

                    if (this.activeTextarea) {
                        this.activeTextarea.value = (this.finalTranscript + ' ' + this.interimTranscript).trim();
                        this.activeTextarea.scrollTop = this.activeTextarea.scrollHeight;
                    }
                };

                this.recognition.onerror = (event) => {
                    console.error('Speech recognition error:', event.error);
                    this.stopRecognition();
                    this.app?.utils?.showAlert('Error pengenalan suara: ' + event.error, 'danger');
                };

                this.recognition.onend = () => {
                    if (this.isListening) {
                        try {
                            this.recognition.start();
                        } catch (err) {
                            console.warn("Gagal restart recognition:", err);
                        }
                    }
                };

                this.useWebSocket = false;
                return;
            }

            if (!window.AudioContext && !window.webkitAudioContext) {
                console.warn('Web Audio API tidak didukung browser ini');
                return;
            }

            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.useWebSocket = true;
        } catch (error) {
            console.error('Error initializing speech recognition:', error);
            this.app?.utils?.showAlert('Gagal menginisialisasi pengenalan suara', 'danger');
        }
    }

    setupSpeechButtons() {
        if (this.buttonsSetup) return; // flag untuk mencegah double setup
        this.buttonsSetup = true;

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

                const activityIndicator = document.createElement('div');
                activityIndicator.className = 'speech-activity-indicator';
                activityIndicator.style.display = 'none';

                container.appendChild(button);
                container.appendChild(activityIndicator);
                textarea.parentNode.style.position = 'relative';
                textarea.parentNode.appendChild(container);
            }
        });
    }

    async toggleRecognition(textarea) {
        if (this.isListening && this.activeTextarea === textarea) {
            await this.stopRecognition();
            this.updateButtonState(textarea, false);
        } else {
            if (this.isListening) {
                await this.stopRecognition();
            }
            await this.startRecognition(textarea);
            this.updateButtonState(textarea, true);
        }
    }

    async startRecognition(textarea) {
        try {
            this.activeTextarea = textarea;
            this.finalTranscript = textarea.value.trim(); // ambil isi awal tanpa split
            this.interimTranscript = '';
            this.isListening = true;

            if (!this.useWebSocket && this.recognition) {
                this.recognition.start();
            } else if (this.useWebSocket) {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                this.stream = stream;

                const source = this.audioContext.createMediaStreamSource(stream);
                this.scriptProcessor = this.audioContext.createScriptProcessor(4096, 1, 1);
                source.connect(this.scriptProcessor);
                this.scriptProcessor.connect(this.audioContext.destination);

                const webSocketEndpoint = 'wss://your-backend-endpoint.com/speech-to-text';
                if (webSocketEndpoint && !webSocketEndpoint.includes('your-backend-endpoint')) {
                    try {
                        this.socket = new WebSocket(webSocketEndpoint);

                        this.socket.onopen = () => {
                            console.log('WebSocket connected');
                            this.scriptProcessor.onaudioprocess = (event) => {
                                const audioData = event.inputBuffer.getChannelData(0);
                                this.socket.send(this.encodeAudio(audioData));
                            };
                        };

                        this.socket.onmessage = (event) => {
                            const data = JSON.parse(event.data);
                            if (data.isFinal) {
                                const cleaned = data.transcript.replace(/\s+/g, ' ').trim();
                                if (!this.finalTranscript.endsWith(cleaned)) {
                                    if (this.finalTranscript) this.finalTranscript += ' ';
                                    this.finalTranscript += cleaned;
                                }
                                this.interimTranscript = '';
                            } else {
                                this.interimTranscript = data.transcript;
                            }

                            if (this.activeTextarea) {
                                this.activeTextarea.value = (this.finalTranscript + ' ' + this.interimTranscript).trim();
                                this.activeTextarea.scrollTop = this.activeTextarea.scrollHeight;
                            }
                        };

                        this.socket.onerror = (error) => {
                            console.error('WebSocket error:', error);
                            this.stopRecognition();
                            this.app?.utils?.showAlert('Koneksi pengenalan suara bermasalah', 'warning');
                        };

                        this.socket.onclose = () => {
                            console.log('WebSocket closed');
                            this.stopRecognition();
                        };
                    } catch (err) {
                        console.error("WebSocket gagal dibuka:", err);
                        this.stopRecognition();
                    }
                } else {
                    this.stopRecognition();
                    this.app?.utils?.showAlert('Fitur pengenalan suara tidak tersedia di browser ini', 'warning');
                    return;
                }
            }

            const indicator = textarea.parentNode.querySelector('.speech-activity-indicator');
            if (indicator) {
                indicator.style.display = 'block';
                indicator.style.animation = 'pulsate 1.5s infinite';
            }

            this.app?.utils?.showAlert('Pengenalan suara aktif. Mulai berbicara sekarang.', 'info');
        } catch (error) {
            console.error('Error starting speech recognition:', error);
            this.isListening = false;
            this.app?.utils?.showAlert('Gagal memulai pengenalan suara', 'danger');
        }
    }

    encodeAudio(audioData) {
        const buffer = new ArrayBuffer(audioData.length * 2);
        const view = new DataView(buffer);
        for (let i = 0; i < audioData.length; i++) {
            const s = Math.max(-1, Math.min(1, audioData[i]));
            view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
        }
        return buffer;
    }

    async stopRecognition() {
        this.isListening = false;

        if (!this.useWebSocket && this.recognition) {
            try { this.recognition.stop(); } catch (err) {}
        } else {
            if (this.scriptProcessor) {
                this.scriptProcessor.onaudioprocess = null;
                this.scriptProcessor.disconnect();
                this.scriptProcessor = null;
            }

            if (this.socket) {
                try { this.socket.close(); } catch {}
                this.socket = null;
            }

            if (this.stream) {
                this.stream.getTracks().forEach(track => track.stop());
                this.stream = null;
            }
        }

        if (this.activeTextarea) {
            const indicator = this.activeTextarea.parentNode.querySelector('.speech-activity-indicator');
            if (indicator) {
                indicator.style.display = 'none';
                indicator.style.animation = 'none';
            }
        }

        this.activeTextarea = null;
        this.interimTranscript = '';
        this.finalTranscript = '';
    }

    updateButtonState(textarea, isListening) {
        const button = textarea.parentNode.querySelector('.speech-btn');
        if (button) {
            if (isListening) {
                button.classList.add('btn-danger');
                button.classList.remove('btn-outline-secondary');
                button.innerHTML = '<i class="bi bi-mic-mute"></i>';
                button.style.animation = 'pulsate 1.5s infinite';
            } else {
                button.classList.remove('btn-danger');
                button.classList.add('btn-outline-secondary');
                button.innerHTML = '<i class="bi bi-mic"></i>';
                button.style.animation = 'none';
            }
        }
    }
}