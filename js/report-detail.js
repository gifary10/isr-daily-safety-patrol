export class ReportDetail {
    constructor(app) {
        this.app = app;
    }

    renderReportDetail(reportId) {
        if (!reportId) {
            this.app.navigation.showReports();
            return;
        }
        
        this.app.utils.showLoading();
        
        setTimeout(() => {
            try {
                const report = this.app.reports.find(r => r.id === reportId);
                if (!report) {
                    this.app.utils.showAlert('Laporan tidak ditemukan', 'danger');
                    this.app.navigation.showReports();
                    return;
                }
                
                this.app.currentReportId = reportId;
                
                const reportInfoHTML = `
                    <div class="col-md-6 report-detail-item">
                        <div class="report-detail-label">Tanggal Patroli</div>
                        <div>${this.app.utils.formatDate(report.date)}</div>
                    </div>
                    <div class="col-md-6 report-detail-item">
                        <div class="report-detail-label">Waktu Patroli</div>
                        <div>${report.time || 'Tidak ada data'}</div>
                    </div>
                    <div class="col-md-6 report-detail-item">
                        <div class="report-detail-label">Lokasi</div>
                        <div>${report.location || 'Tidak ada data'}</div>
                    </div>
                    <div class="col-md-6 report-detail-item">
                        <div class="report-detail-label">Status</div>
                        <div>
                            <span class="status-badge status-${(report.status || 'open').replace(' ', '-')}">
                                ${this.app.utils.getStatusText(report.status || 'open')}
                            </span>
                        </div>
                    </div>
                    ${report.notes ? `
                        <div class="col-12 report-detail-item">
                            <div class="report-detail-label">Catatan Umum</div>
                            <div>${report.notes}</div>
                        </div>
                    ` : ''}
                    <div class="col-12 report-detail-item">
                        <div class="report-detail-label">Dibuat Pada</div>
                        <div>${this.app.utils.formatDateTime(report.createdAt)}</div>
                    </div>
                    <div class="col-12 report-detail-item">
                        <div class="report-detail-label">Diperbarui Pada</div>
                        <div>${this.app.utils.formatDateTime(report.updatedAt)}</div>
                    </div>
                `;
                
                this.app.elements.reportDetailInfo.innerHTML = reportInfoHTML;
                
                let findingsHTML = '';
                
                if (!report.findings || report.findings.length === 0) {
                    findingsHTML = `
                        <div class="alert alert-info">
                            Tidak ada temuan keamanan dalam laporan ini.
                        </div>
                    `;
                } else {
                    report.findings.forEach((finding, index) => {
                        findingsHTML += `
                            <div class="patrol-item mb-3">
                                <div class="d-flex justify-content-between align-items-center mb-2">
                                    <h6 class="mb-0 priority-${finding.priority || 'medium'}">Temuan #${index + 1}: ${finding.category || 'Tidak ada kategori'}</h6>
                                    <span class="status-badge status-${(finding.status || 'open').replace(' ', '-')}">
                                        ${this.app.utils.getStatusText(finding.status || 'open')}
                                    </span>
                                </div>
                                <div class="mb-2">
                                    <span class="badge bg-light text-dark">${this.app.utils.capitalizeFirstLetter(finding.priority || 'medium')}</span>
                                </div>
                                <p class="finding-description">${finding.description || 'Tidak ada deskripsi'}</p>
                                ${finding.action ? `<p class="finding-action"><strong>Tindakan:</strong> ${finding.action}</p>` : ''}
                                <div class="mt-3">
                                    <button class="btn btn-sm btn-outline-primary me-2 update-finding-status" data-finding-index="${index}" data-status="in-progress">
                                        Tandai Proses
                                    </button>
                                    <button class="btn btn-sm btn-outline-success update-finding-status" data-finding-index="${index}" data-status="resolved">
                                        Tandai Selesai
                                    </button>
                                </div>
                            </div>
                        `;
                    });
                }
                
                this.app.elements.reportFindingsList.innerHTML = findingsHTML;
                
                document.querySelectorAll('.update-finding-status').forEach(button => {
                    button.addEventListener('click', () => {
                        const findingIndex = parseInt(button.dataset.findingIndex);
                        const newStatus = button.dataset.status;
                        this.updateFindingStatus(findingIndex, newStatus);
                    });
                });
            } catch (error) {
                console.error('Error rendering report detail:', error);
                this.app.utils.showAlert('Gagal memuat detail laporan', 'danger');
            } finally {
                this.app.utils.hideLoading();
            }
        }, 500);
    }

    updateFindingStatus(findingIndex, newStatus) {
        if (isNaN(findingIndex) || !newStatus) return;
        
        try {
            const report = this.app.reports.find(r => r.id === this.app.currentReportId);
            if (!report || !report.findings) return;
            
            if (findingIndex >= 0 && findingIndex < report.findings.length) {
                report.findings[findingIndex].status = newStatus;
                report.updatedAt = new Date().toISOString();
                
                const allResolved = report.findings.every(f => f.status === 'resolved');
                const anyInProgress = report.findings.some(f => f.status === 'in-progress');
                
                if (allResolved) {
                    report.status = 'resolved';
                } else if (anyInProgress) {
                    report.status = 'in-progress';
                } else {
                    report.status = 'open';
                }
                
                this.app.saveReports();
                this.renderReportDetail(report.id);
                this.app.utils.showAlert('Status temuan berhasil diperbarui', 'success');
            }
        } catch (error) {
            console.error('Error updating finding status:', error);
            this.app.utils.showAlert('Gagal memperbarui status temuan', 'danger');
        }
    }
}