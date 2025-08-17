export class ReportsList {
    constructor(app) {
        this.app = app;
    }

    initEventListeners() {
        try {
            if (this.app.elements.reportSearch) {
                this.app.elements.reportSearch.addEventListener('input', () => this.filterReports());
            }
            if (this.app.elements.clearSearch) {
                this.app.elements.clearSearch.addEventListener('click', () => {
                    if (this.app.elements.reportSearch) {
                        this.app.elements.reportSearch.value = '';
                    }
                    this.filterReports();
                });
            }
            if (this.app.elements.reportStatusFilter) {
                this.app.elements.reportStatusFilter.addEventListener('change', () => this.filterReports());
            }
            
            // Event delegation for report items
            if (this.app.elements.reportsList) {
                this.app.elements.reportsList.addEventListener('click', (e) => {
                    if (e.target.closest('.report-item')) {
                        const reportId = e.target.closest('.report-item').dataset.reportId;
                        if (reportId) {
                            this.app.navigation.showReportDetail(reportId);
                        }
                    }
                });
            }
            
            // Event delegation for pagination
            if (this.app.elements.reportPagination) {
                this.app.elements.reportPagination.addEventListener('click', (e) => {
                    if (e.target.closest('.page-link')) {
                        e.preventDefault();
                        const page = parseInt(e.target.closest('.page-link').dataset.page);
                        if (!isNaN(page)) {
                            this.changePage(page);
                        }
                    }
                });
            }
        } catch (error) {
            console.error('Error initializing reports list event listeners:', error);
        }
    }

    renderReportsList() {
        if (!this.app || !this.app.reports) return;
        
        this.app.utils.showLoading();
        
        setTimeout(() => {
            try {
                const searchTerm = this.app.elements.reportSearch ? 
                                 this.app.elements.reportSearch.value.toLowerCase() : '';
                const statusFilter = this.app.elements.reportStatusFilter ? 
                                    this.app.elements.reportStatusFilter.value : 'all';
                
                let filteredReports = this.app.reports.filter(report => {
                    const matchesSearch = report.location && report.location.toLowerCase().includes(searchTerm) || 
                                         report.notes && report.notes.toLowerCase().includes(searchTerm);
                    
                    const matchesStatus = statusFilter === 'all' || 
                                         (statusFilter === 'open' && report.status === 'open') ||
                                         (statusFilter === 'in-progress' && report.status === 'in-progress') ||
                                         (statusFilter === 'resolved' && report.status === 'resolved');
                    
                    return matchesSearch && matchesStatus;
                });
                
                const totalPages = Math.ceil(filteredReports.length / this.app.itemsPerPage);
                const startIndex = (this.app.currentPage - 1) * this.app.itemsPerPage;
                const paginatedReports = filteredReports.slice(startIndex, startIndex + this.app.itemsPerPage);
                
                let reportsHTML = '';
                
                if (paginatedReports.length === 0) {
                    reportsHTML = `
                        <div class="alert alert-info">
                            Tidak ada laporan yang ditemukan.
                        </div>
                    `;
                } else {
                    paginatedReports.forEach(report => {
                        const openFindings = report.findings ? report.findings.filter(f => f.status === 'open').length : 0;
                        const inProgressFindings = report.findings ? report.findings.filter(f => f.status === 'in-progress').length : 0;
                        const resolvedFindings = report.findings ? report.findings.filter(f => f.status === 'resolved').length : 0;
                        
                        reportsHTML += `
                            <div class="list-group-item list-group-item-action report-item cursor-pointer" data-report-id="${report.id || ''}">
                                <div class="d-flex justify-content-between">
                                    <div>
                                        <h6 class="mb-1">${report.location || 'Tidak ada lokasi'}</h6>
                                        <small class="text-muted">${this.app.utils.formatDate(report.date)} • ${report.findings ? report.findings.length : 0} temuan</small>
                                        <div class="mt-2">
                                            ${openFindings > 0 ? `<span class="badge bg-warning me-1">${openFindings} Terbuka</span>` : ''}
                                            ${inProgressFindings > 0 ? `<span class="badge bg-info me-1">${inProgressFindings} Proses</span>` : ''}
                                            ${resolvedFindings > 0 ? `<span class="badge bg-success">${resolvedFindings} Selesai</span>` : ''}
                                        </div>
                                    </div>
                                    <div class="text-end">
                                        <span class="status-badge status-${(report.status || 'open').replace(' ', '-')}">
                                            ${this.app.utils.getStatusText(report.status || 'open')}
                                        </span>
                                        <div class="mt-2">
                                            <small class="text-muted">${this.app.utils.formatDateTime(report.createdAt)}</small>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `;
                    });
                }
                
                if (this.app.elements.reportsList) {
                    this.app.elements.reportsList.innerHTML = reportsHTML;
                }
                
                let paginationHTML = '';
                
                if (totalPages > 1 && this.app.elements.reportPagination) {
                    paginationHTML = `
                        <li class="page-item ${this.app.currentPage === 1 ? 'disabled' : ''}">
                            <a class="page-link" href="#" data-page="${this.app.currentPage - 1}">Sebelumnya</a>
                        </li>
                    `;
                    
                    for (let i = 1; i <= totalPages; i++) {
                        paginationHTML += `
                            <li class="page-item ${i === this.app.currentPage ? 'active' : ''}">
                                <a class="page-link" href="#" data-page="${i}">${i}</a>
                            </li>
                        `;
                    }
                    
                    paginationHTML += `
                        <li class="page-item ${this.app.currentPage === totalPages ? 'disabled' : ''}">
                            <a class="page-link" href="#" data-page="${this.app.currentPage + 1}">Selanjutnya</a>
                        </li>
                    `;
                }
                
                if (this.app.elements.reportPagination) {
                    this.app.elements.reportPagination.innerHTML = paginationHTML;
                }
            } catch (error) {
                console.error('Error rendering reports list:', error);
                if (this.app.elements.reportsList) {
                    this.app.elements.reportsList.innerHTML = `
                        <div class="alert alert-danger">
                            Gagal memuat daftar laporan.
                        </div>
                    `;
                }
            } finally {
                this.app.utils.hideLoading();
            }
        }, 500);
    }

    filterReports() {
        this.app.currentPage = 1;
        this.renderReportsList();
    }

    changePage(page) {
        if (isNaN(page)) return;
        
        this.app.currentPage = page;
        this.renderReportsList();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}