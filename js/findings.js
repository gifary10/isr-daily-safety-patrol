export class Findings {
    constructor(app) {
        this.app = app;
    }

    initEventListeners() {
        if (this.app.elements.addFinding && this.app.elements.findingModal) {
            this.app.elements.addFinding.addEventListener('click', () => {
                this.app.elements.findingModal.show();
            });
        }
        
        if (this.app.elements.saveFinding) {
            this.app.elements.saveFinding.addEventListener('click', () => {
                this.saveFinding();
            });
        }
        
        if (this.app.elements.findingCategory) {
            this.app.elements.findingCategory.addEventListener('change', () => {
                if (this.app.elements.findingCategory.value === 'other') {
                    this.app.elements.otherCategoryContainer.style.display = 'block';
                    this.app.elements.otherCategory.required = true;
                } else {
                    this.app.elements.otherCategoryContainer.style.display = 'none';
                    this.app.elements.otherCategory.required = false;
                }
            });
        }
        
        if (this.app.elements.findingsContainer) {
            this.app.elements.findingsContainer.addEventListener('click', (e) => {
                if (e.target.closest('.delete-finding')) {
                    const findingId = e.target.closest('.delete-finding').dataset.finding;
                    this.deleteFinding(findingId);
                }
            });
        }
    }

    saveFinding() {
        if (!this.app.elements.findingForm.checkValidity()) {
            this.app.elements.findingForm.classList.add('was-validated');
            return;
        }
        
        try {
            const category = this.app.elements.findingCategory.value === 'other' ? 
                             (this.app.elements.otherCategory.value || 'Lainnya') : 
                             (this.app.elements.findingCategory.value || 'Tidak ada kategori');
            
            const priority = this.app.elements.findingPriority.value || 'medium';
            const description = this.app.elements.findingDescription.value || 'Tidak ada deskripsi';
            const action = this.app.elements.findingAction.value || '';
            
            const finding = {
                id: 'finding-' + Date.now(),
                category,
                priority,
                description,
                action,
            };
            
            this.addFindingToContainer(finding);
            
            this.app.elements.findingModal.hide();
            this.app.elements.findingForm.reset();
            this.app.elements.findingForm.classList.remove('was-validated');
            this.app.elements.otherCategoryContainer.style.display = 'none';
        } catch (error) {
            console.error('Error saving finding:', error);
            this.app.utils.showAlert('Gagal menyimpan temuan', 'danger');
        }
    }

    addFindingToContainer(finding) {
        if (!this.app.elements.findingsContainer) return;
        
        try {
            const alert = this.app.elements.findingsContainer.querySelector('.alert');
            if (alert) {
                this.app.elements.findingsContainer.removeChild(alert);
            }
            
            const findingCard = document.createElement('div');
            findingCard.className = 'card mb-3 fade-in';
            findingCard.id = finding.id;
            findingCard.innerHTML = `
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <div>
                            <h6 class="mb-0 priority-${finding.priority || 'medium'}">${finding.category || 'Tidak ada kategori'}</h6>
                            <p class="text-muted small mb-0">Prioritas ${this.app.utils.capitalizeFirstLetter(finding.priority || 'medium')}</p>
                        </div>
                        <button class="btn btn-sm btn-outline-danger delete-finding cursor-pointer" data-finding="${finding.id}">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                    <p class="mt-2">${finding.description || 'Tidak ada deskripsi'}</p>
                    ${finding.action ? `<p><strong>Tindakan:</strong> ${finding.action}</p>` : ''}
                </div>
            `;
            
            this.app.elements.findingsContainer.appendChild(findingCard);
        } catch (error) {
            console.error('Error adding finding to container:', error);
            this.app.utils.showAlert('Gagal menambahkan temuan', 'danger');
        }
    }

    deleteFinding(findingId) {
        if (!findingId) return;
        
        this.app.utils.showConfirmModal(
            'Hapus Temuan',
            'Apakah Anda yakin ingin menghapus temuan ini?',
            () => {
                try {
                    const findingCard = document.getElementById(findingId);
                    if (findingCard) {
                        findingCard.classList.add('fade-out');
                        setTimeout(() => {
                            this.app.elements.findingsContainer.removeChild(findingCard);
                            
                            if (this.app.elements.findingsContainer.children.length === 0) {
                                this.app.elements.findingsContainer.innerHTML = `
                                    <div class="alert alert-info fade-in">
                                        Belum ada temuan. Klik "Tambah" untuk memulai.
                                    </div>
                                `;
                            }
                        }, 300);
                    }
                } catch (error) {
                    console.error('Error deleting finding:', error);
                    this.app.utils.showAlert('Gagal menghapus temuan', 'danger');
                }
            }
        );
    }
}