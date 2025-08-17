export class Utils {
    constructor(app) {
        this.app = app;
    }

    showLoading() {
        if (this.app.elements.loadingOverlay) {
            this.app.elements.loadingOverlay.classList.add('active');
        }
    }

    hideLoading() {
        if (this.app.elements.loadingOverlay) {
            this.app.elements.loadingOverlay.classList.remove('active');
        }
    }

    showAlert(message, type = 'success') {
        try {
            const alert = document.createElement('div');
            alert.className = `alert alert-${type} alert-dismissible fade show position-fixed top-0 end-0 m-3`;
            alert.style.zIndex = '9999';
            alert.innerHTML = `
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            `;
            
            document.body.appendChild(alert);
            
            setTimeout(() => {
                alert.classList.remove('show');
                setTimeout(() => alert.remove(), 150);
            }, 5000);
        } catch (error) {
            console.error('Error showing alert:', error);
        }
    }

    showConfirmModal(title, message, confirmCallback) {
        try {
            const titleElement = document.getElementById('confirm-modal-title');
            const bodyElement = document.getElementById('confirm-modal-body');
            
            if (titleElement) titleElement.textContent = title || 'Konfirmasi';
            if (bodyElement) bodyElement.textContent = message || 'Apakah Anda yakin?';
            
            this.app.confirmAction = confirmCallback;
            
            if (this.app.elements.confirmModal) {
                this.app.elements.confirmModal.show();
            }
        } catch (error) {
            console.error('Error showing confirm modal:', error);
        }
    }

    getStatusText(status) {
        if (!status) return 'Tidak diketahui';
        
        switch (status.toLowerCase()) {
            case 'open': return 'Terbuka';
            case 'in-progress': return 'Dalam Proses';
            case 'resolved': return 'Terselesaikan';
            default: return status;
        }
    }

    formatDate(dateString) {
        if (!dateString) return 'Tidak ada data';
        
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return 'Tanggal tidak valid';
            
            const format = this.app.elements.dateFormat ? this.app.elements.dateFormat.value : 'dd-mm-yyyy';
            
            switch (format) {
                case 'dd-mm-yyyy':
                    return date.toLocaleDateString('id-ID', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                    });
                case 'mm-dd-yyyy':
                    return date.toLocaleDateString('en-US', {
                        month: '2-digit',
                        day: '2-digit',
                        year: 'numeric'
                    });
                case 'yyyy-mm-dd':
                    return date.toISOString().split('T')[0];
                default:
                    return date.toLocaleDateString('id-ID', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                    });
            }
        } catch (error) {
            console.error('Error formatting date:', error);
            return 'Format tanggal tidak valid';
        }
    }

    formatDateTime(dateTimeString) {
        if (!dateTimeString) return 'Tidak ada data';
        
        try {
            const date = new Date(dateTimeString);
            if (isNaN(date.getTime())) return 'Tanggal/waktu tidak valid';
            
            return `${this.formatDate(dateTimeString)} ${date.toLocaleTimeString('id-ID', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: false
            })}`;
        } catch (error) {
            console.error('Error formatting date/time:', error);
            return 'Format tanggal/waktu tidak valid';
        }
    }

    capitalizeFirstLetter(string) {
        if (!string) return '';
        return string.charAt(0).toUpperCase() + string.slice(1);
    }
}