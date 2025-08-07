export class ReportForm {
    constructor(app) {
        this.app = app;
    }

    initEventListeners() {
        if (this.app.elements.cancelReport) {
            this.app.elements.cancelReport.addEventListener('click', (e) => {
                e.preventDefault();
                this.confirmCancelReport();
            });
        }
        
        if (this.app.elements.patrolReportForm) {
            this.app.elements.patrolReportForm.addEventListener('submit', (e) => this.handleReportSubmit(e));
        }
        
        if (this.app.elements.previewReport) {
            this.app.elements.previewReport.addEventListener('click', (e) => {
                e.preventDefault();
                this.previewReport();
            });
        }
        
        if (this.app.elements.reportLocation) {
            this.app.elements.reportLocation.addEventListener('change', () => {
                if (this.app.elements.reportLocation.value === 'other') {
                    this.app.elements.otherLocationContainer.style.display = 'block';
                    this.app.elements.otherLocation.required = true;
                } else {
                    this.app.elements.otherLocationContainer.style.display = 'none';
                    this.app.elements.otherLocation.required = false;
                }
            });
        }
    }

    setDefaultDateTime() {
        const now = new Date();
        if (this.app.elements.reportDate) {
            this.app.elements.reportDate.value = now.toISOString().split('T')[0];
        }
        if (this.app.elements.reportTime) {
            this.app.elements.reportTime.value = now.toTimeString().substring(0, 5);
        }
    }

    confirmCancelReport() {
        const hasData = this.app.elements.reportDate.value || 
                      this.app.elements.reportTime.value || 
                      this.app.elements.reportLocation.value || 
                      this.app.elements.reportNotes.value || 
                      (this.app.elements.findingsContainer && 
                       this.app.elements.findingsContainer.querySelector('.card'));
        
        if (!hasData) {
            this.app.navigation.showDashboard();
            return;
        }
        
        this.app.utils.showConfirmModal(
            'Batalkan Laporan',
            'Anda memiliki data yang belum disimpan. Apakah Anda yakin ingin membatalkan?',
            () => {
                this.app.elements.patrolReportForm.reset();
                this.app.elements.findingsContainer.innerHTML = `
                    <div class="alert alert-info">
                        Belum ada temuan. Klik "Tambah" untuk memulai.
                    </div>
                `;
                this.app.navigation.showDashboard();
            }
        );
    }

    checkForUnsavedDraft() {
        const today = new Date().toISOString().split('T')[0];
        const draft = this.app.drafts.find(d => d.date === today);
        
        if (draft) {
            this.app.utils.showConfirmModal(
                'Draft Tersedia',
                'Anda memiliki draft laporan yang belum diselesaikan. Apakah Anda ingin melanjutkan draft tersebut?',
                () => this.loadDraft(draft)
            );
        }
    }

    loadDraft(draft) {
        if (!draft) return;
        
        try {
            this.app.elements.reportDate.value = draft.date;
            this.app.elements.reportTime.value = draft.time;
            this.app.elements.reportLocation.value = draft.location;
            
            if (draft.location === 'other') {
                this.app.elements.otherLocationContainer.style.display = 'block';
                this.app.elements.otherLocation.value = draft.otherLocation;
            }
            
            this.app.elements.reportNotes.value = draft.notes;
            
            if (draft.findings && draft.findings.length > 0) {
                this.app.elements.findingsContainer.innerHTML = '';
                draft.findings.forEach(finding => {
                    this.app.findings.addFindingToContainer(finding);
                });
            }
            
            this.app.utils.showAlert('Draft berhasil dimuat', 'success');
        } catch (error) {
            console.error('Error loading draft:', error);
            this.app.utils.showAlert('Gagal memuat draft', 'danger');
        }
    }

    previewReport() {
        if (!this.app.elements.patrolReportForm.checkValidity()) {
            this.app.elements.patrolReportForm.classList.add('was-validated');
            this.app.utils.showAlert('Harap isi semua field yang wajib', 'danger');
            return;
        }
        
        try {
            const findingCards = this.app.elements.findingsContainer.querySelectorAll('.card');
            if (findingCards.length === 0) {
                this.app.utils.showAlert('Harap tambahkan setidaknya satu temuan safety', 'warning');
                return;
            }
            
            const location = this.app.elements.reportLocation.value === 'other' ? 
                            this.app.elements.otherLocation.value : 
                            this.app.elements.reportLocation.value;
            
            let findingsHTML = '';
            findingCards.forEach((card, index) => {
                findingsHTML += `
                    <div class="patrol-item">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <h6 class="mb-0 ${card.querySelector('h6').className}">Temuan #${index + 1}: ${card.querySelector('h6').textContent}</h6>
                        </div>
                        <p>${card.querySelector('p').textContent}</p>
                        ${card.querySelector('p:last-child') ? `<p><strong>Tindakan:</strong> ${card.querySelector('p:last-child').textContent.replace('Tindakan: ', '')}</p>` : ''}
                    </div>
                `;
            });
            
            const previewContent = `
                <div class="mb-4">
                    <h4>Lihat Laporan Patrol</h4>
                    <hr>
                    <div class="row">
                        <div class="col-md-6">
                            <p><strong>Tanggal:</strong> ${this.app.utils.formatDate(this.app.elements.reportDate.value)}</p>
                            <p><strong>Waktu:</strong> ${this.app.elements.reportTime.value}</p>
                        </div>
                        <div class="col-md-6">
                            <p><strong>Lokasi:</strong> ${location}</p>
                        </div>
                    </div>
                    ${this.app.elements.reportNotes.value ? `
                        <div class="mb-3">
                            <h5>Catatan Umum</h5>
                            <p>${this.app.elements.reportNotes.value}</p>
                        </div>
                    ` : ''}
                    <div class="mb-3">
                        <h5>Temuan Safety</h5>
                        ${findingsHTML}
                    </div>
                </div>
            `;
            
            document.getElementById('preview-content').innerHTML = previewContent;
            this.app.elements.previewModal.show();
        } catch (error) {
            console.error('Error previewing report:', error);
            this.app.utils.showAlert('Gagal membuat preview', 'danger');
        }
    }

    handleReportSubmit(e) {
        if (e) e.preventDefault();
        
        if (!this.app.elements.patrolReportForm.checkValidity()) {
            this.app.elements.patrolReportForm.classList.add('was-validated');
            this.app.utils.showAlert('Harap isi semua field yang wajib', 'danger');
            return;
        }
        
        try {
            const findingCards = this.app.elements.findingsContainer.querySelectorAll('.card');
            if (findingCards.length === 0) {
                this.app.utils.showAlert('Harap tambahkan setidaknya satu temuan safety', 'warning');
                return;
            }
            
            this.app.utils.showLoading();
            
            setTimeout(() => {
                try {
                    const location = this.app.elements.reportLocation.value === 'other' ? 
                                    this.app.elements.otherLocation.value : 
                                    this.app.elements.reportLocation.value;
                    
                    const report = {
                        id: 'report-' + Date.now(),
                        date: this.app.elements.reportDate.value,
                        time: this.app.elements.reportTime.value,
                        location,
                        notes: this.app.elements.reportNotes.value,
                        findings: [],
                        status: 'open',
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    };
                    
                    findingCards.forEach(card => {
                        report.findings.push({
                            category: card.querySelector('h6').textContent,
                            priority: card.querySelector('h6').className.includes('high') ? 'high' : 
                                      card.querySelector('h6').className.includes('medium') ? 'medium' : 'low',
                            description: card.querySelector('p').textContent,
                            action: card.querySelector('p:last-child') ? 
                                    card.querySelector('p:last-child').textContent.replace('Tindakan: ', '') : '',
                            status: 'open'
                        });
                    });
                    
                    this.app.reports.unshift(report);
                    this.app.saveReports();
                    
                    const today = new Date().toISOString().split('T')[0];
                    this.app.drafts = this.app.drafts.filter(d => d.date !== today);
                    this.app.saveDrafts();
                    
                    this.app.elements.patrolReportForm.reset();
                    this.app.elements.findingsContainer.innerHTML = `
                        <div class="alert alert-info fade-in">
                            Belum ada temuan. Klik "Tambah" untuk memulai.
                        </div>
                    `;
                    
                    this.app.utils.showAlert('Laporan berhasil dikirim!', 'success');
                    this.app.navigation.showDashboard();
                    this.app.dashboard.updateDashboardStats();
                } catch (error) {
                    console.error('Error submitting report:', error);
                    this.app.utils.showAlert('Gagal mengirim laporan', 'danger');
                } finally {
                    this.app.utils.hideLoading();
                }
            }, 1500);
        } catch (error) {
            console.error('Error handling report submit:', error);
            this.app.utils.showAlert('Gagal memproses laporan', 'danger');
            this.app.utils.hideLoading();
        }
    }
}