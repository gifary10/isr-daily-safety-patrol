export class Settings {
    constructor(app) {
        this.app = app;
    }

    initEventListeners() {
        try {
            // Settings button
            if (document.getElementById('settings-button')) {
                document.getElementById('settings-button').addEventListener('click', () => {
                    this.showSettingsModal();
                });
            }

            // Save settings button
            if (document.getElementById('save-settings')) {
                document.getElementById('save-settings').addEventListener('click', () => {
                    this.saveSettings();
                });
            }

            // Logo upload preview
            if (document.getElementById('company-logo')) {
                document.getElementById('company-logo').addEventListener('change', (e) => {
                    this.previewLogo(e.target.files[0]);
                });
            }
        } catch (error) {
            console.error('Error initializing settings event listeners:', error);
        }
    }

    showSettingsModal() {
        try {
            // Load current settings
            const settings = JSON.parse(localStorage.getItem('safetyPatrolSettings')) || {};
            
            if (document.getElementById('reporter-name')) {
                document.getElementById('reporter-name').value = settings.reporterName || '';
            }
            if (document.getElementById('supervisor-name')) {
                document.getElementById('supervisor-name').value = settings.supervisorName || '';
            }

            // Show modal
            const settingsModal = new bootstrap.Modal(document.getElementById('settingsModal'));
            settingsModal.show();
        } catch (error) {
            console.error('Error showing settings modal:', error);
        }
    }

    previewLogo(file) {
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            // You could show a preview here if needed
        };
        reader.readAsDataURL(file);
    }

    saveSettings() {
        try {
            const settings = {
                reporterName: document.getElementById('reporter-name')?.value || '',
                supervisorName: document.getElementById('supervisor-name')?.value || ''
            };

            // Handle logo upload
            const logoInput = document.getElementById('company-logo');
            if (logoInput?.files?.length > 0) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    settings.companyLogo = e.target.result;
                    this.app.pdfGenerator.saveSettings(settings);
                    const settingsModal = bootstrap.Modal.getInstance(document.getElementById('settingsModal'));
                    settingsModal.hide();
                    this.app.utils.showAlert('Pengaturan berhasil disimpan', 'success');
                };
                reader.readAsDataURL(logoInput.files[0]);
            } else {
                this.app.pdfGenerator.saveSettings(settings);
                const settingsModal = bootstrap.Modal.getInstance(document.getElementById('settingsModal'));
                settingsModal.hide();
                this.app.utils.showAlert('Pengaturan berhasil disimpan', 'success');
            }
        } catch (error) {
            console.error('Error saving settings:', error);
            this.app.utils.showAlert('Gagal menyimpan pengaturan', 'danger');
        }
    }
}