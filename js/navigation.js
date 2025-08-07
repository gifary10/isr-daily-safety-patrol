export class Navigation {
    constructor(app) {
        this.app = app;
    }

    initEventListeners() {
        if (this.app.elements.navDashboard) {
            this.app.elements.navDashboard.addEventListener('click', (e) => {
                e.preventDefault();
                this.showDashboard();
            });
        }
        
        if (this.app.elements.navNewReport) {
            this.app.elements.navNewReport.addEventListener('click', (e) => {
                e.preventDefault();
                this.showNewReport();
            });
        }
        
        if (this.app.elements.navReports) {
            this.app.elements.navReports.addEventListener('click', (e) => {
                e.preventDefault();
                this.showReports();
            });
        }
        
        if (document.getElementById('bottom-nav-dashboard')) {
            document.getElementById('bottom-nav-dashboard').addEventListener('click', (e) => {
                e.preventDefault();
                this.showDashboard();
            });
        }
        
        if (document.getElementById('bottom-nav-new-report')) {
            document.getElementById('bottom-nav-new-report').addEventListener('click', (e) => {
                e.preventDefault();
                this.showNewReport();
            });
        }
        
        if (document.getElementById('bottom-nav-reports')) {
            document.getElementById('bottom-nav-reports').addEventListener('click', (e) => {
                e.preventDefault();
                this.showReports();
            });
        }
        
        if (this.app.elements.backToReports) {
            this.app.elements.backToReports.addEventListener('click', () => this.showReports());
        }
    }

    showDashboard() {
        this.hideAllSections();
        this.app.elements.dashboardContent.style.display = 'block';
        this.updateActiveNav('dashboard');
        this.app.dashboard.updateDashboardStats();
    }

    showNewReport() {
        this.hideAllSections();
        this.app.elements.newReportContent.style.display = 'block';
        this.updateActiveNav('new-report');
        this.app.reportForm.checkForUnsavedDraft();
    }

    showReports() {
        this.hideAllSections();
        this.app.elements.reportsContent.style.display = 'block';
        this.updateActiveNav('reports');
        this.app.reportsList.renderReportsList();
    }

    showReportDetail(reportId) {
        if (!reportId) return;
        
        this.hideAllSections();
        this.app.elements.reportDetailContent.style.display = 'block';
        this.updateActiveNav(null);
        this.app.reportDetail.renderReportDetail(reportId);
    }

    hideAllSections() {
        const sections = [
            'dashboardContent',
            'newReportContent',
            'reportsContent',
            'reportDetailContent'
        ];
        
        sections.forEach(section => {
            if (this.app.elements[section]) {
                this.app.elements[section].style.display = 'none';
            }
        });
    }

    updateActiveNav(activeItem) {
        const desktopNavItems = [
            'navDashboard',
            'navNewReport',
            'navReports'
        ];
        
        const bottomNavItems = [
            'bottom-nav-dashboard',
            'bottom-nav-new-report',
            'bottom-nav-reports'
        ];
        
        desktopNavItems.forEach(item => {
            if (this.app.elements[item]) {
                this.app.elements[item].classList.remove('active');
            }
        });
        
        bottomNavItems.forEach(item => {
            const element = document.getElementById(item);
            if (element) {
                element.classList.remove('active');
            }
        });
        
        if (activeItem) {
            const desktopItem = `nav${activeItem.charAt(0).toUpperCase() + activeItem.slice(1).replace('-', '')}`;
            if (this.app.elements[desktopItem]) {
                this.app.elements[desktopItem].classList.add('active');
            }
            
            const bottomItem = `bottom-nav-${activeItem.replace(' ', '-').toLowerCase()}`;
            const bottomElement = document.getElementById(bottomItem);
            if (bottomElement) {
                bottomElement.classList.add('active');
            }
        }
    }
}