/**
 * Safety Patrol Application - Main File
 */
import { Navigation } from './navigation.js';
import { ReportForm } from './report-form.js';
import { Findings } from './findings.js';
import { ReportsList } from './reports-list.js';
import { ReportDetail } from './report-detail.js';
import { Dashboard } from './dashboard.js';
import { Utils } from './utils.js';
import { SpeechRecognitionHandler } from './speech-recognition.js';

class SafetyPatrolApp {
    constructor() {
        this.utils = new Utils(this);
        this.navigation = new Navigation(this);
        this.reportForm = new ReportForm(this);
        this.findings = new Findings(this);
        this.reportsList = new ReportsList(this);
        this.reportDetail = new ReportDetail(this);
        this.dashboard = new Dashboard(this);
        this.speechRecognition = new SpeechRecognitionHandler(this);
        
        document.addEventListener('DOMContentLoaded', () => {
            try {
                this.initElements();
                this.initEventListeners();
                this.initApp();
            } catch (error) {
                console.error('Failed to initialize app:', error);
                this.utils.showAlert('Gagal memulai aplikasi. Silakan muat ulang halaman.', 'danger');
            }
        });
    }

    initElements() {
        this.elements = {
            dashboardContent: document.getElementById('dashboard-content'),
            newReportContent: document.getElementById('patrol-report-form'),
            reportsContent: document.getElementById('reports-content'),
            reportDetailContent: document.getElementById('report-detail-content'),
            
            totalPatrols: document.getElementById('total-patrols'),
            openIssues: document.getElementById('open-issues'),
            resolvedIssues: document.getElementById('resolved-issues'),
            complianceRate: document.getElementById('compliance-rate'),
            patrolTrend: document.getElementById('patrol-trend'),
            issuesTrend: document.getElementById('issues-trend'),
            resolvedTrend: document.getElementById('resolved-trend'),
            complianceTrend: document.getElementById('compliance-trend'),
            priorityIssuesContainer: document.getElementById('priority-issues-container'),
            refreshDashboard: document.getElementById('refresh-dashboard'),
            dashboardPeriod: document.getElementById('dashboard-period'),
                
            patrolReportForm: document.getElementById('patrol-report-form'),
            reportDate: document.getElementById('report-date'),
            reportTime: document.getElementById('report-time'),
            reportLocation: document.getElementById('report-location'),
            otherLocation: document.getElementById('other-location'),
            otherLocationContainer: document.getElementById('other-location-container'),
            reportNotes: document.getElementById('report-notes'),
            findingsContainer: document.getElementById('findings-container'),
            addFinding: document.getElementById('add-finding'),
            previewReport: document.getElementById('preview-report'),
            saveDraft: document.getElementById('save-draft'),
            cancelReport: document.getElementById('cancel-report'),
            
            findingForm: document.getElementById('finding-form'),
            findingCategory: document.getElementById('finding-category'),
            otherCategory: document.getElementById('other-category'),
            otherCategoryContainer: document.getElementById('other-category-container'),
            findingPriority: document.getElementById('finding-priority'),
            findingDescription: document.getElementById('finding-description'),
            findingAction: document.getElementById('finding-action'),
            saveFinding: document.getElementById('save-finding'),
            
            reportSearch: document.getElementById('report-search'),
            reportStatusFilter: document.getElementById('report-status-filter'),
            reportsList: document.getElementById('reports-list'),
            reportPagination: document.getElementById('report-pagination'),
            
            reportDetailInfo: document.getElementById('report-detail-info'),
            reportFindingsList: document.getElementById('report-findings-list'),
            printReport: document.getElementById('print-report'),
            backToReports: document.getElementById('back-to-reports'),
            
            navDashboard: document.getElementById('nav-dashboard'),
            navNewReport: document.getElementById('nav-new-report'),
            navReports: document.getElementById('nav-reports'),
            
            loadingOverlay: document.querySelector('.loading-overlay')
        };

        if (document.getElementById('findingModal')) {
            this.elements.findingModal = new bootstrap.Modal(document.getElementById('findingModal'));
        }
        if (document.getElementById('confirmModal')) {
            this.elements.confirmModal = new bootstrap.Modal(document.getElementById('confirmModal'));
        }
        if (document.getElementById('previewModal')) {
            this.elements.previewModal = new bootstrap.Modal(document.getElementById('previewModal'));
        }
        
        const confirmActionBtn = document.getElementById('confirm-action');
        if (confirmActionBtn) {
            confirmActionBtn.addEventListener('click', () => {
                if (this.confirmAction) {
                    this.confirmAction();
                }
                if (this.elements.confirmModal) {
                    this.elements.confirmModal.hide();
                }
            });
        }

        const previewSubmitBtn = document.getElementById('submit-after-preview');
        if (previewSubmitBtn) {
            previewSubmitBtn.addEventListener('click', () => {
                if (this.elements.previewModal) {
                    this.elements.previewModal.hide();
                }
                this.reportForm.handleReportSubmit(new Event('submit'));
            });
        }

        this.reports = [];
        this.drafts = [];
        this.currentReportId = null;
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.confirmAction = null;
    }

    initEventListeners() {
        this.navigation.initEventListeners();
        
        if (this.elements.patrolReportForm) {
            this.reportForm.initEventListeners();
        }
        if (this.elements.findingsContainer) {
            this.findings.initEventListeners();
        }
        if (this.elements.reportsList) {
            this.reportsList.initEventListeners();
        }
        if (this.elements.dashboardContent) {
            this.dashboard.initEventListeners();
        }

        if (this.speechRecognition) {
            this.speechRecognition.setupSpeechButtons();
        }
    }

    initApp() {
        this.loadReports();
        this.navigation.showDashboard();
        if (this.elements.reportDate) {
            this.reportForm.setDefaultDateTime();
        }
    }

    loadReports() {
        try {
            this.reports = JSON.parse(localStorage.getItem('safetyPatrolReports')) || [];
            this.drafts = JSON.parse(localStorage.getItem('safetyPatrolDrafts')) || [];
            this.dashboard.updateDashboardStats();
        } catch (error) {
            console.error('Error loading reports:', error);
            this.reports = [];
            this.drafts = [];
            this.utils.showAlert('Gagal memuat data laporan. Data akan direset.', 'warning');
        }
    }

    saveReports() {
        try {
            localStorage.setItem('safetyPatrolReports', JSON.stringify(this.reports));
        } catch (error) {
            console.error('Error saving reports:', error);
            this.utils.showAlert('Gagal menyimpan laporan.', 'danger');
        }
    }

    saveDrafts() {
        try {
            localStorage.setItem('safetyPatrolDrafts', JSON.stringify(this.drafts));
        } catch (error) {
            console.error('Error saving drafts:', error);
            this.utils.showAlert('Gagal menyimpan draft.', 'danger');
        }
    }
}

new SafetyPatrolApp();