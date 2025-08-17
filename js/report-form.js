export class ReportForm {
    constructor(app) {
        this.app = app;
    }

    initEventListeners() {
        try {
            if (this.app.elements.cancelReport) {
                this.app.elements.cancelReport.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.confirmCancelReport();
                });
            }
            
            if (this.app.elements.saveDraft) {
                this.app.elements.saveDraft.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.saveReportDraft();
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
                        if (this.app.elements.otherLocationContainer) {
                            this.app.elements.otherLocationContainer.style.display = 'block';
                        }
                        if (this.app.elements.otherLocation) {
                            this.app.elements.otherLocation.required = true;
                        }
                    } else {
                        if (this.app.elements.otherLocationContainer) {
                            this.app.elements.otherLocationContainer.style.display = 'none';
                        }
                        if (this.app.elements.otherLocation) {
                            this.app.elements.otherLocation.required = false;
                        }
                    }
                });
            }
        } catch (error) {
            console.error('Error initializing report form event listeners:', error);
        }
    }

    setDefaultDateTime() {
        try {
            const now = new Date();
            if (this.app.elements.reportDate) {
                this.app.elements.reportDate.value = now.toISOString().split('T')[0];
            }
            if (this.app.elements.reportTime) {
                this.app.elements.reportTime.value = now.toTimeString().substring(0, 5);
            }
        } catch (error) {
            console.error('Error setting default date/time:', error);
        }
    }

    confirmCancelReport() {
        try {
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
                    if (this.app.elements.patrolReportForm) {
                        this.app.elements.patrolReportForm.reset();
                    }
                    if (this.app.elements.findingsContainer) {
                        this.app.elements.findingsContainer.innerHTML = `
                            <div class="alert alert-info">
                                Belum ada temuan. Klik "Tambah" untuk memulai.
                            </div>
                        `;
                    }
                    this.app.navigation.showDashboard();
                }
            );
        } catch (error) {
            console.error('Error confirming cancel report:', error);
        }
    }

    checkForUnsavedDraft() {
        try {
            const today = new Date().toISOString().split('T')[0];
            const draft = this.app.drafts.find(d => d.date === today);
            
            if (draft) {
                this.app.utils.showConfirmModal(
                    'Draft Tersedia',
                    'Anda memiliki draft laporan yang belum diselesaikan. Apakah Anda ingin melanjutkan draft tersebut?',
                    () => this.loadDraft(draft)
                );
            }
        } catch (error) {
            console.error('Error checking for unsaved draft:', error);
        }
    }

    loadDraft(draft) {
        try {
            if (!draft) return;
            
            if (this.app.elements.reportDate) {
                this.app.elements.reportDate.value = draft.date;
            }
            if (this.app.elements.reportTime) {
                this.app.elements.reportTime.value = draft.time;
            }
            if (this.app.elements.reportLocation) {
                this.app.elements.reportLocation.value = draft.location;
            }
            
            if (draft.location === 'other' && this.app.elements.otherLocationContainer && this.app.elements.otherLocation) {
                this.app.elements.otherLocationContainer.style.display = 'block';
                this.app.elements.otherLocation.value = draft.otherLocation;
            }
            
            if (this.app.elements.reportNotes) {
                this.app.elements.reportNotes.value = draft.notes;
            }
            
            if (draft.findings && draft.findings.length > 0 && this.app.elements.findingsContainer) {
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

    saveReportDraft() {
        if (!this.app.elements.patrolReportForm || !this.app.elements.patrolReportForm.checkValidity()) {
            if (this.app.elements.patrolReportForm) {
                this.app.elements.patrolReportForm.classList.add('was-validated');
            }
            this.app.utils.showAlert('Harap isi semua field yang wajib', 'danger');
            return;
        }
        
        try {
            const draft = {
                id: 'draft-' + Date.now(),
                date: this.app.elements.reportDate ? this.app.elements.reportDate.value : '',
                time: this.app.elements.reportTime ? this.app.elements.reportTime.value : '',
                location: this.app.elements.reportLocation ? this.app.elements.reportLocation.value : '',
                otherLocation: this.app.elements.reportLocation && this.app.elements.reportLocation.value === 'other' && this.app.elements.otherLocation ? 
                             this.app.elements.otherLocation.value : '',
                notes: this.app.elements.reportNotes ? this.app.elements.reportNotes.value : '',
                findings: [],
                createdAt: new Date().toISOString()
            };
            
            if (this.app.elements.findingsContainer) {
                const findingCards = this.app.elements.findingsContainer.querySelectorAll('.card');
                findingCards.forEach(card => {
                    const descriptionElement = card.querySelector('.finding-description');
                    const actionElement = card.querySelector('.finding-action');
                    
                    draft.findings.push({
                        id: card.id,
                        category: card.querySelector('h6') ? card.querySelector('h6').textContent : 'Tidak ada kategori',
                        priority: card.querySelector('h6') && card.querySelector('h6').className.includes('high') ? 'high' : 
                                 card.querySelector('h6') && card.querySelector('h6').className.includes('medium') ? 'medium' : 'low',
                        description: descriptionElement ? descriptionElement.textContent : 'Tidak ada deskripsi',
                        action: actionElement ? actionElement.textContent.replace('Tindakan:', '').trim() : '',
                        status: 'open'
                    });
                });
            }
            
            const existingIndex = this.app.drafts.findIndex(d => d.id === draft.id);
            if (existingIndex >= 0) {
                this.app.drafts[existingIndex] = draft;
            } else {
                this.app.drafts.push(draft);
            }
            
            this.app.saveDrafts();
            this.app.utils.showAlert('Draft berhasil disimpan', 'success');
        } catch (error) {
            console.error('Error saving report draft:', error);
            this.app.utils.showAlert('Gagal menyimpan draft', 'danger');
        }
    }

    previewReport() {
        if (!this.app.elements.patrolReportForm || !this.app.elements.patrolReportForm.checkValidity()) {
            if (this.app.elements.patrolReportForm) {
                this.app.elements.patrolReportForm.classList.add('was-validated');
            }
            this.app.utils.showAlert('Harap isi semua field yang wajib', 'danger');
            return;
        }
        
        try {
            const findingCards = this.app.elements.findingsContainer ? 
                                this.app.elements.findingsContainer.querySelectorAll('.card') : [];
            if (findingCards.length === 0) {
                this.app.utils.showAlert('Harap tambahkan setidaknya satu temuan keamanan', 'warning');
                return;
            }
            
            const location = this.app.elements.reportLocation && this.app.elements.reportLocation.value === 'other' && this.app.elements.otherLocation ? 
                            this.app.elements.otherLocation.value : 
                            (this.app.elements.reportLocation ? this.app.elements.reportLocation.value : 'Tidak ada lokasi');
            
            let findingsHTML = '';
            findingCards.forEach((card, index) => {
                const descriptionElement = card.querySelector('.finding-description');
                const actionElement = card.querySelector('.finding-action');
                
                findingsHTML += `
                    <div class="patrol-item">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <h6 class="mb-0 ${card.querySelector('h6') ? card.querySelector('h6').className : ''}">Temuan #${index + 1}: ${card.querySelector('h6') ? card.querySelector('h6').textContent : 'Tidak ada kategori'}</h6>
                        </div>
                        <p class="finding-description">${descriptionElement ? descriptionElement.textContent : 'Tidak ada deskripsi'}</p>
                        ${actionElement ? `<p class="finding-action"><strong>Tindakan:</strong> ${actionElement.textContent.replace('Tindakan:', '').trim()}</p>` : ''}
                    </div>
                `;
            });
            
            const previewContent = `
                <div class="mb-4">
                    <h4>Lihat Laporan Patrol</h4>
                    <hr>
                    <div class="row">
                        <div class="col-md-6">
                            <p><strong>Tanggal:</strong> ${this.app.elements.reportDate ? this.app.utils.formatDate(this.app.elements.reportDate.value) : 'Tidak ada data'}</p>
                            <p><strong>Waktu:</strong> ${this.app.elements.reportTime ? this.app.elements.reportTime.value : 'Tidak ada data'}</p>
                        </div>
                        <div class="col-md-6">
                            <p><strong>Lokasi:</strong> ${location}</p>
                        </div>
                    </div>
                    ${this.app.elements.reportNotes && this.app.elements.reportNotes.value ? `
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
            
            if (document.getElementById('preview-content')) {
                document.getElementById('preview-content').innerHTML = previewContent;
            }
            if (this.app.elements.previewModal) {
                this.app.elements.previewModal.show();
            }
        } catch (error) {
            console.error('Error previewing report:', error);
            this.app.utils.showAlert('Gagal membuat pratinjau', 'danger');
        }
    }

    handleReportSubmit(e) {
        if (e) e.preventDefault();
        
        if (!this.app.elements.patrolReportForm || !this.app.elements.patrolReportForm.checkValidity()) {
            if (this.app.elements.patrolReportForm) {
                this.app.elements.patrolReportForm.classList.add('was-validated');
            }
            this.app.utils.showAlert('Harap isi semua field yang wajib', 'danger');
            return;
        }
        
        try {
            const findingCards = this.app.elements.findingsContainer ? 
                                this.app.elements.findingsContainer.querySelectorAll('.card') : [];
            if (findingCards.length === 0) {
                this.app.utils.showAlert('Harap tambahkan setidaknya satu temuan keamanan', 'warning');
                return;
            }
            
            this.app.utils.showLoading();
            
            setTimeout(() => {
                try {
                    const location = this.app.elements.reportLocation && this.app.elements.reportLocation.value === 'other' && this.app.elements.otherLocation ? 
                                    this.app.elements.otherLocation.value : 
                                    (this.app.elements.reportLocation ? this.app.elements.reportLocation.value : 'Tidak ada lokasi');
                    
                    const report = {
                        id: 'report-' + Date.now(),
                        date: this.app.elements.reportDate ? this.app.elements.reportDate.value : '',
                        time: this.app.elements.reportTime ? this.app.elements.reportTime.value : '',
                        location,
                        notes: this.app.elements.reportNotes ? this.app.elements.reportNotes.value : '',
                        findings: [],
                        status: 'open',
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    };
                    
                    findingCards.forEach(card => {
                        const descriptionElement = card.querySelector('.finding-description');
                        const actionElement = card.querySelector('.finding-action');
                        
                        report.findings.push({
                            id: card.id,
                            category: card.querySelector('h6') ? card.querySelector('h6').textContent : 'Tidak ada kategori',
                            priority: card.querySelector('h6') && card.querySelector('h6').className.includes('high') ? 'high' : 
                                      card.querySelector('h6') && card.querySelector('h6').className.includes('medium') ? 'medium' : 'low',
                            description: descriptionElement ? descriptionElement.textContent : 'Tidak ada deskripsi',
                            action: actionElement ? actionElement.textContent.replace('Tindakan:', '').trim() : '',
                            status: 'open'
                        });
                    });
                    
                    this.app.reports.unshift(report);
                    this.app.saveReports();
                    
                    // Remove draft if exists
                    const today = new Date().toISOString().split('T')[0];
                    this.app.drafts = this.app.drafts.filter(d => d.date !== today);
                    this.app.saveDrafts();
                    
                    if (this.app.elements.patrolReportForm) {
                        this.app.elements.patrolReportForm.reset();
                    }
                    if (this.app.elements.findingsContainer) {
                        this.app.elements.findingsContainer.innerHTML = `
                            <div class="alert alert-info fade-in">
                                Belum ada temuan. Klik "Tambah" untuk memulai.
                            </div>
                        `;
                    }
                    
                    this.app.utils.showAlert('Laporan berhasil dikirim!', 'success');
                    this.app.navigation.showDashboard();
                    if (this.app.dashboard) {
                        this.app.dashboard.updateDashboardStats();
                    }
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