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
import { PdfGenerator } from './pdf-generator.js';
import { Settings } from './settings.js';

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
        this.pdfGenerator = new PdfGenerator(this);
        this.settings = new Settings(this);
        
        // Initialize after DOM is loaded
        document.addEventListener('DOMContentLoaded', async () => {
            try {
                this.initElements();
                this.initEventListeners();
                await this.speechRecognition.initRecognition();
                
                // Preload PDF library
                await this.pdfGenerator.loadJsPDF();
                
                this.initApp();
                window.app = this; // Make available globally for debugging
            } catch (error) {
                console.error('Failed to initialize app:', error);
                this.utils.showAlert('Gagal memulai aplikasi. Silakan muat ulang halaman.', 'danger');
            }
        });
    }

    initElements() {
        try {
            this.elements = {
                // Main sections
                dashboardContent: document.getElementById('dashboard-content'),
                newReportContent: document.getElementById('patrol-report-form'),
                reportsContent: document.getElementById('reports-content'),
                reportDetailContent: document.getElementById('report-detail-content'),
                
                // Dashboard elements
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
                    
                // Report Form elements
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
                
                // Findings elements
                findingForm: document.getElementById('finding-form'),
                findingCategory: document.getElementById('finding-category'),
                otherCategory: document.getElementById('other-category'),
                otherCategoryContainer: document.getElementById('other-category-container'),
                findingPriority: document.getElementById('finding-priority'),
                findingDescription: document.getElementById('finding-description'),
                findingAction: document.getElementById('finding-action'),
                saveFinding: document.getElementById('save-finding'),
                
                // Reports List elements
                reportSearch: document.getElementById('report-search'),
                clearSearch: document.getElementById('clear-search'),
                reportStatusFilter: document.getElementById('report-status-filter'),
                reportsList: document.getElementById('reports-list'),
                reportPagination: document.getElementById('report-pagination'),
                
                // Report Detail elements
                reportDetailInfo: document.getElementById('report-detail-info'),
                reportFindingsList: document.getElementById('report-findings-list'),
                printReport: document.getElementById('print-report'),
                backToReports: document.getElementById('back-to-reports'),
                
                // Navigation elements
                navDashboard: document.getElementById('nav-dashboard'),
                navNewReport: document.getElementById('nav-new-report'),
                navReports: document.getElementById('nav-reports'),
                
                // Settings elements
                settingsButton: document.getElementById('settings-button'),
                settingsModal: document.getElementById('settingsModal'),
                saveSettings: document.getElementById('save-settings'),
                
                // Other elements
                loadingOverlay: document.querySelector('.loading-overlay'),
                dateFormat: document.getElementById('date-format') || { value: 'dd-mm-yyyy' }
            };

            // Initialize Bootstrap modals
            if (document.getElementById('findingModal')) {
                this.elements.findingModal = new bootstrap.Modal(document.getElementById('findingModal'));
            }
            if (document.getElementById('confirmModal')) {
                this.elements.confirmModal = new bootstrap.Modal(document.getElementById('confirmModal'));
            }
            if (document.getElementById('previewModal')) {
                this.elements.previewModal = new bootstrap.Modal(document.getElementById('previewModal'));
            }
            if (document.getElementById('settingsModal')) {
                this.elements.settingsModal = new bootstrap.Modal(document.getElementById('settingsModal'));
            }
            
            // Confirm modal action handler
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

            // Preview modal submit handler
            const previewSubmitBtn = document.getElementById('submit-after-preview');
            if (previewSubmitBtn) {
                previewSubmitBtn.addEventListener('click', () => {
                    if (this.elements.previewModal) {
                        this.elements.previewModal.hide();
                    }
                    if (this.reportForm) {
                        this.reportForm.handleReportSubmit(new Event('submit'));
                    }
                });
            }

            // Print report handler
            if (this.elements.printReport) {
                this.elements.printReport.addEventListener('click', async () => {
                    try {
                        await this.pdfGenerator.generatePdf(this.currentReportId);
                    } catch (error) {
                        console.error('Error generating PDF:', error);
                        this.utils.showAlert('Gagal membuat PDF. Silakan coba lagi.', 'danger');
                    }
                });
            }
        } catch (error) {
            console.error('Error initializing elements:', error);
            throw error;
        }
        
        // Data storage
        this.reports = [];
        this.drafts = [];
        this.currentReportId = null;
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.confirmAction = null;
    }

    initEventListeners() {
        try {
            // Initialize navigation first as it's always needed
            this.navigation.initEventListeners();
            
            // Initialize other modules if their elements exist
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

            // Initialize settings
            this.settings.initEventListeners();

            // Setup speech recognition buttons for all textareas
            if (this.speechRecognition) {
                this.speechRecognition.setupSpeechButtons();
            }
        } catch (error) {
            console.error('Error initializing event listeners:', error);
            this.utils.showAlert('Gagal memulai fungsi aplikasi. Silakan muat ulang halaman.', 'danger');
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
            if (this.dashboard) {
                this.dashboard.updateDashboardStats();
            }
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

// Initialize the app
new SafetyPatrolApp();