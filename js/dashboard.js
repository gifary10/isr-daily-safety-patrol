export class Dashboard {
    constructor(app) {
        this.app = app;
    }

    initEventListeners() {
        try {
            if (this.app.elements.dashboardPeriod) {
                this.app.elements.dashboardPeriod.addEventListener('change', () => this.updateDashboardStats());
            }
            
            if (this.app.elements.refreshDashboard) {
                this.app.elements.refreshDashboard.addEventListener('click', () => this.updateDashboardStats());
            }
        } catch (error) {
            console.error('Error initializing dashboard event listeners:', error);
        }
    }

    updateDashboardStats() {
        if (!this.app || !this.app.reports) return;
        
        this.app.utils.showLoading();
        
        setTimeout(() => {
            try {
                const period = this.app.elements.dashboardPeriod ? 
                             this.app.elements.dashboardPeriod.value : 
                             'week';
                
                let filteredReports = [];
                let comparisonReports = [];
                
                const now = new Date();
                const currentDate = now.toISOString().split('T')[0];
                
                if (period === 'today') {
                    filteredReports = this.app.reports.filter(r => r.date === currentDate);
                    comparisonReports = this.app.reports.filter(r => {
                        const reportDate = new Date(r.date);
                        const yesterday = new Date(now);
                        yesterday.setDate(yesterday.getDate() - 1);
                        return reportDate.toISOString().split('T')[0] === yesterday.toISOString().split('T')[0];
                    });
                } else if (period === 'week') {
                    const oneWeekAgo = new Date(now);
                    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
                    
                    filteredReports = this.app.reports.filter(r => {
                        const reportDate = new Date(r.date);
                        return reportDate >= oneWeekAgo && reportDate <= now;
                    });
                    
                    comparisonReports = this.app.reports.filter(r => {
                        const reportDate = new Date(r.date);
                        const twoWeeksAgo = new Date(now);
                        twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
                        const oneWeekAgo = new Date(now);
                        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
                        return reportDate >= twoWeeksAgo && reportDate <= oneWeekAgo;
                    });
                } else if (period === 'month') {
                    const oneMonthAgo = new Date(now);
                    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
                    
                    filteredReports = this.app.reports.filter(r => {
                        const reportDate = new Date(r.date);
                        return reportDate >= oneMonthAgo && reportDate <= now;
                    });
                    
                    comparisonReports = this.app.reports.filter(r => {
                        const reportDate = new Date(r.date);
                        const twoMonthsAgo = new Date(now);
                        twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
                        const oneMonthAgo = new Date(now);
                        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
                        return reportDate >= twoMonthsAgo && reportDate <= oneMonthAgo;
                    });
                } else if (period === 'year') {
                    const oneYearAgo = new Date(now);
                    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
                    
                    filteredReports = this.app.reports.filter(r => {
                        const reportDate = new Date(r.date);
                        return reportDate >= oneYearAgo && reportDate <= now;
                    });
                    
                    comparisonReports = this.app.reports.filter(r => {
                        const reportDate = new Date(r.date);
                        const twoYearsAgo = new Date(now);
                        twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
                        const oneYearAgo = new Date(now);
                        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
                        return reportDate >= twoYearsAgo && reportDate <= oneYearAgo;
                    });
                }
                
                const totalPatrols = filteredReports.length;
                const comparisonPatrols = comparisonReports.length;
                const patrolTrend = comparisonPatrols > 0 ? 
                                  Math.round(((totalPatrols - comparisonPatrols) / comparisonPatrols) * 100) : 0;
                
                const openIssues = filteredReports.reduce((sum, report) => {
                    return sum + (report.findings ? report.findings.filter(f => f.status === 'open').length : 0);
                }, 0);
                
                const comparisonOpenIssues = comparisonReports.reduce((sum, report) => {
                    return sum + (report.findings ? report.findings.filter(f => f.status === 'open').length : 0);
                }, 0);
                
                const issuesTrend = comparisonOpenIssues > 0 ? 
                                   Math.round(((openIssues - comparisonOpenIssues) / comparisonOpenIssues) * 100) : 0;
                
                const resolvedIssues = filteredReports.reduce((sum, report) => {
                    return sum + (report.findings ? report.findings.filter(f => f.status === 'resolved').length : 0);
                }, 0);
                
                const comparisonResolvedIssues = comparisonReports.reduce((sum, report) => {
                    return sum + (report.findings ? report.findings.filter(f => f.status === 'resolved').length : 0);
                }, 0);
                
                const resolvedTrend = comparisonResolvedIssues > 0 ? 
                                     Math.round(((resolvedIssues - comparisonResolvedIssues) / comparisonResolvedIssues) * 100) : 0;
                
                const totalFindings = filteredReports.reduce((sum, report) => sum + (report.findings ? report.findings.length : 0), 0);
                const complianceRate = totalFindings > 0 ? 
                                      Math.round((resolvedIssues / totalFindings) * 100) : 100;
                
                const comparisonTotalFindings = comparisonReports.reduce((sum, report) => sum + (report.findings ? report.findings.length : 0), 0);
                const comparisonComplianceRate = comparisonTotalFindings > 0 ? 
                                               Math.round((comparisonResolvedIssues / comparisonTotalFindings) * 100) : 100;
                
                const complianceTrend = comparisonComplianceRate > 0 ? 
                                      Math.round(((complianceRate - comparisonComplianceRate) / comparisonComplianceRate) * 100) : 0;
                
                if (this.app.elements.totalPatrols) {
                    this.app.elements.totalPatrols.textContent = totalPatrols;
                }
                if (this.app.elements.openIssues) {
                    this.app.elements.openIssues.textContent = openIssues;
                }
                if (this.app.elements.resolvedIssues) {
                    this.app.elements.resolvedIssues.textContent = resolvedIssues;
                }
                if (this.app.elements.complianceRate) {
                    this.app.elements.complianceRate.textContent = complianceRate + '%';
                }
                
                if (this.app.elements.patrolTrend) {
                    this.updateTrendIndicator(this.app.elements.patrolTrend, patrolTrend, 'patroli');
                }
                if (this.app.elements.issuesTrend) {
                    this.updateTrendIndicator(this.app.elements.issuesTrend, issuesTrend, 'masalah');
                }
                if (this.app.elements.resolvedTrend) {
                    this.updateTrendIndicator(this.app.elements.resolvedTrend, resolvedTrend, 'penyelesaian');
                }
                if (this.app.elements.complianceTrend) {
                    this.updateTrendIndicator(this.app.elements.complianceTrend, complianceTrend, 'kepatuhan');
                }
                
                this.renderPriorityIssues(filteredReports);
            } catch (error) {
                console.error('Error updating dashboard stats:', error);
                this.app.utils.showAlert('Gagal memuat data dashboard', 'danger');
            } finally {
                this.app.utils.hideLoading();
            }
        }, 500);
    }

    updateTrendIndicator(element, trend, label) {
        if (!element) return;
        
        if (trend > 0) {
            element.innerHTML = `<i class="bi bi-arrow-up"></i> ${Math.abs(trend)}% dari periode lalu`;
            element.className = 'card-text text-success small';
        } else if (trend < 0) {
            element.innerHTML = `<i class="bi bi-arrow-down"></i> ${Math.abs(trend)}% dari periode lalu`;
            element.className = 'card-text text-danger small';
        } else {
            element.innerHTML = `<i class="bi bi-dash"></i> 0% dari periode lalu`;
            element.className = 'card-text text-muted small';
        }
    }

    renderPriorityIssues(reports) {
        if (!this.app.elements.priorityIssuesContainer || !reports) return;
        
        try {
            let allFindings = [];
            reports.forEach(report => {
                if (report.findings) {
                    report.findings.forEach(finding => {
                        allFindings.push({
                            ...finding,
                            reportDate: report.date,
                            reportLocation: report.location,
                            reportId: report.id
                        });
                    });
                }
            });
            
            const priorityFindings = allFindings.filter(f => f.status !== 'resolved');
            
            priorityFindings.sort((a, b) => {
                const priorityOrder = { high: 3, medium: 2, low: 1 };
                return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
            });
            
            const topFindings = priorityFindings.slice(0, 5);
            
            let priorityIssuesHTML = '';
            
            if (topFindings.length === 0) {
                priorityIssuesHTML = `
                    <div class="alert alert-success">
                        Tidak ada masalah prioritas yang perlu ditindaklanjuti.
                    </div>
                `;
            } else {
                topFindings.forEach(finding => {
                    priorityIssuesHTML += `
                        <div class="patrol-item">
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <h6 class="mb-0 priority-${finding.priority || 'medium'}">${finding.priority === 'high' ? 'Tinggi' : finding.priority === 'medium' ? 'Sedang' : 'Rendah'}: ${finding.category || 'Tidak ada kategori'}</h6>
                                <span class="status-badge status-${(finding.status || 'open').replace(' ', '-')}">
                                    ${this.app.utils.getStatusText(finding.status || 'open')}
                                </span>
                            </div>
                            <p class="text-muted small mb-2">${finding.reportLocation || 'Tidak ada lokasi'} • ${this.app.utils.formatDate(finding.reportDate)}</p>
                            <p class="small">${finding.description || 'Tidak ada deskripsi'}</p>
                            ${finding.action ? `<p class="small"><strong>Tindakan:</strong> ${finding.action}</p>` : ''}
                            <button class="btn btn-sm btn-outline-primary view-report" data-report-id="${finding.reportId}">
                                Lihat Laporan
                            </button>
                        </div>
                    `;
                });
            }
            
            this.app.elements.priorityIssuesContainer.innerHTML = priorityIssuesHTML;
            
            document.querySelectorAll('.view-report').forEach(button => {
                button.addEventListener('click', () => {
                    const reportId = button.dataset.reportId;
                    this.app.navigation.showReportDetail(reportId);
                });
            });
        } catch (error) {
            console.error('Error rendering priority issues:', error);
            this.app.elements.priorityIssuesContainer.innerHTML = `
                <div class="alert alert-danger">
                    Gagal memuat masalah prioritas.
                </div>
            `;
        }
    }
}