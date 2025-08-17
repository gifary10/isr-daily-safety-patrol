export class PdfGenerator {
    constructor(app) {
        this.app = app;
        this.companyLogo = null;
        this.reporterName = '';
        this.supervisorName = '';
        this.jsPDF = null;
        this.loadSettings();
    }

    async loadJsPDF() {
        if (this.jsPDF) return;
        try {
            if (window.jspdf && window.jspdf.jsPDF) {
                this.jsPDF = window.jspdf.jsPDF;
                return;
            }
            const { jsPDF } = window.jspdf || {};
            if (jsPDF) {
                this.jsPDF = jsPDF;
                return;
            }
            throw new Error('jsPDF not available');
        } catch (error) {
            console.error('Failed to load jsPDF:', error);
            this.app.utils.showAlert('Gagal memuat library PDF. Silakan muat ulang halaman.', 'danger');
            throw error;
        }
    }

    loadSettings() {
        try {
            const settings = JSON.parse(localStorage.getItem('safetyPatrolSettings')) || {};
            this.companyLogo = settings.companyLogo || null;
            this.reporterName = settings.reporterName || '';
            this.supervisorName = settings.supervisorName || '';
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    }

    saveSettings(settings) {
        try {
            localStorage.setItem('safetyPatrolSettings', JSON.stringify(settings));
            this.loadSettings();
        } catch (error) {
            console.error('Error saving settings:', error);
            this.app.utils.showAlert('Gagal menyimpan pengaturan', 'danger');
        }
    }

    async generatePdf(reportId) {
        if (!reportId) {
            this.app.utils.showAlert('ID laporan tidak valid', 'danger');
            return;
        }

        this.app.utils.showLoading();
        
        try {
            await this.loadJsPDF();
            const report = this.app.reports.find(r => r.id === reportId);
            if (!report) {
                this.app.utils.showAlert('Laporan tidak ditemukan', 'danger');
                return;
            }

            let pdf = new this.jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            pdf.setProperties({
                title: `Laporan Safety Patrol - ${this.app.utils.formatDate(report.date)}`,
                subject: 'Laporan Safety Patrol Harian',
                author: this.reporterName || 'Safety Patrol',
                creator: 'Safety Patrol App'
            });

            // 🎨 Warna
            const primaryColor = [48, 48, 48];
            const secondaryColor = [108, 117, 125];
            const successColor = [40, 167, 69];
            const warningColor = [253, 126, 20];
            const dangerColor = [220, 53, 69];
            const infoColor = [23, 162, 184];

            let y = 20;

            // 🏢 Logo perusahaan
            if (this.companyLogo) {
                try {
                    const imgData = await this.loadImage(this.companyLogo);
                    pdf.addImage(imgData, 'JPEG', 20, y, 30, 15);
                } catch (e) {
                    console.error("Logo error:", e);
                }
            }

            // Judul
            pdf.setFontSize(16);
            pdf.setTextColor(...primaryColor);
            pdf.setFont('helvetica', 'bold');
            pdf.text('LAPORAN SAFETY PATROL HARIAN', 105, y + 10, { align: 'center' });
            y += 25;

            // === Informasi Patroli ===
            y = this.addSectionHeader(pdf, 'INFORMASI PATROLI', y);
            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(40);

            pdf.text(`Tanggal: ${this.app.utils.formatDate(report.date)}`, 20, y);
            pdf.text(`Waktu: ${report.time || '-'}`, 110, y);
            y += 7;

            pdf.text(`Lokasi: ${report.location || '-'}`, 20, y);
            y += 7;

            // Status
            const statusText = this.app.utils.getStatusText(report.status || 'open');
            pdf.text('Status Laporan:', 110, y);
            const badgeWidth = pdf.getTextWidth(statusText) + 8;

            pdf.setFillColor(...(
                report.status === 'resolved' ? successColor :
                report.status === 'in-progress' ? infoColor : warningColor
            ));
            pdf.roundedRect(140, y - 5, badgeWidth, 8, 3, 3, 'F');
            pdf.setTextColor(255, 255, 255);
            pdf.text(statusText, 144, y);
            pdf.setTextColor(40);
            y += 12;

            // === Catatan Umum ===
            if (report.notes) {
                y = this.addSectionHeader(pdf, 'CATATAN UMUM PATROLI', y);
                pdf.setFontSize(10);
                pdf.setFont('helvetica', 'normal');
                const lines = pdf.splitTextToSize(report.notes, 170);
                pdf.text(lines, 20, y);
                y += lines.length * 5 + 10;
            }

            // === Temuan Safety ===
            y = this.addSectionHeader(pdf, 'TEMUAN SAFETY DAN TINDAKAN', y);

            if (!report.findings?.length) {
                pdf.text('Tidak ada temuan safety selama patroli.', 20, y);
                y += 10;
            } else {
                const total = report.findings.length;
                const open = report.findings.filter(f => f.status === 'open').length;
                const inprog = report.findings.filter(f => f.status === 'in-progress').length;
                const done = report.findings.filter(f => f.status === 'resolved').length;

                // Ringkasan tabel
                pdf.setFont('helvetica', 'bold');
                pdf.text('Ringkasan Temuan:', 20, y);
                y += 7;

                this.addSummaryTable(pdf, { total, open, inprog, done }, y);
                y += 20;

                // Detail
                pdf.setFont('helvetica', 'bold');
                pdf.text('Detail Temuan:', 20, y);
                y += 8;

                for (let i = 0; i < report.findings.length; i++) {
                    const f = report.findings[i];
                    if (y > 220) {
                        pdf.addPage();
                        y = 20;
                        y = this.addSectionHeader(pdf, 'TEMUAN SAFETY DAN TINDAKAN (lanjutan)', y);
                    }

                    const color = f.priority === 'high' ? dangerColor : f.priority === 'medium' ? warningColor : successColor;

                    pdf.setFillColor(...color);
                    pdf.circle(20, y - 2, 2, 'F');
                    pdf.setFont('helvetica', 'bold');
                    pdf.setTextColor(40);
                    const title = `Temuan #${i + 1}: ${f.category || 'Tanpa kategori'}`;
                    const lines = pdf.splitTextToSize(title, 160);
                    pdf.text(lines, 25, y);
                    y += lines.length * 5 + 3;

                    pdf.setFont('helvetica', 'normal');
                    pdf.setTextColor(...color);
                    pdf.text(`Prioritas: ${this.app.utils.capitalizeFirstLetter(f.priority)}`, 25, y);

                    const status = this.app.utils.getStatusText(f.status);
                    const sw = pdf.getTextWidth(status) + 8;
                    pdf.setTextColor(40);
                    pdf.text('Status:', 110, y);

                    pdf.setFillColor(...(f.status === 'resolved' ? successColor : f.status === 'in-progress' ? infoColor : warningColor));
                    pdf.roundedRect(130, y - 5, sw, 8, 3, 3, 'F');
                    pdf.setTextColor(255, 255, 255);
                    pdf.text(status, 134, y);
                    pdf.setTextColor(40);
                    y += 8;

                    pdf.setFont('helvetica', 'bold');
                    pdf.text('Deskripsi:', 25, y);
                    y += 5;
                    pdf.setFont('helvetica', 'normal');
                    const desc = pdf.splitTextToSize(f.description || '-', 160);
                    pdf.text(desc, 25, y);
                    y += desc.length * 5 + 3;

                    if (f.action) {
                        pdf.setFont('helvetica', 'bold');
                        pdf.text('Rekomendasi:', 25, y);
                        y += 5;
                        pdf.setFont('helvetica', 'normal');
                        const act = pdf.splitTextToSize(f.action, 160);
                        pdf.text(act, 25, y);
                        y += act.length * 5 + 3;
                    }

                    if (f.status === 'resolved') {
                        pdf.setFont('helvetica', 'bold');
                        pdf.text('Tindakan Dilakukan:', 25, y);
                        y += 5;
                        pdf.setFont('helvetica', 'normal');
                        const res = pdf.splitTextToSize('Temuan telah ditangani dan diselesaikan.', 160);
                        pdf.text(res, 25, y);
                        y += res.length * 5 + 3;
                    }

                    if (i < report.findings.length - 1) {
                        pdf.setDrawColor(200, 200, 200);
                        pdf.line(20, y, 190, y);
                        y += 8;
                    }
                }
            }

            // === Tanda tangan ===
            const totalPages = pdf.internal.getNumberOfPages();
            pdf.setPage(totalPages);
            pdf.setDrawColor(180, 180, 180);
            pdf.line(20, 240, 190, 240);
            y = 245;

            pdf.setFontSize(10);
            pdf.setTextColor(40);
            pdf.text('Pembuat Laporan:', 40, y);
            pdf.line(40, y + 5, 80, y + 5);
            pdf.text(this.reporterName || '(Nama Pembuat)', 40, y + 12);

            pdf.text('Mengetahui,', 120, y);
            pdf.line(120, y + 5, 160, y + 5);
            pdf.text(this.supervisorName || '(Nama Atasan)', 120, y + 12);

            // === Footer semua halaman ===
            const footerText = `Dicetak pada: ${this.app.utils.formatDateTime(new Date().toISOString())}`;
            for (let i = 1; i <= totalPages; i++) {
                pdf.setPage(i);
                pdf.setFontSize(8);
                pdf.setTextColor(120);
                pdf.text(20, 287, footerText, { align: 'left' });
                pdf.text(`Halaman ${i} dari ${totalPages}`, 190, 287, { align: 'right' });
            }

            pdf.save(`Laporan Safety Patrol - ${this.app.utils.formatDate(report.date)}.pdf`);
            this.app.utils.showAlert('PDF berhasil dibuat', 'success');
        } catch (e) {
            console.error('Error PDF:', e);
            this.app.utils.showAlert(`Gagal membuat PDF: ${e.message}`, 'danger');
        } finally {
            this.app.utils.hideLoading();
        }
    }

    addSectionHeader(pdf, title, y) {
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(48);
        pdf.text(title, 20, y);
        pdf.setDrawColor(200, 200, 200);
        pdf.line(20, y + 2, 190, y + 2);
        return y + 10;
    }

    addSummaryTable(pdf, { total, open, inprog, done }, y) {
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.setDrawColor(180, 180, 180);
        pdf.setLineWidth(0.3);

        pdf.setFillColor(230, 230, 230);
        pdf.rect(20, y, 170, 8, 'F');
        pdf.text('Total', 30, y + 6);
        pdf.text('Terbuka', 70, y + 6);
        pdf.text('Dalam Proses', 110, y + 6);
        pdf.text('Terselesaikan', 160, y + 6);

        y += 8;
        pdf.text(`${total}`, 30, y + 6);
        pdf.text(`${open}`, 70, y + 6);
        pdf.text(`${inprog}`, 110, y + 6);
        pdf.text(`${done}`, 160, y + 6);
    }

    async loadImage(src) {
        return new Promise((resolve, reject) => {
            let imgSrc = src;
            if (!src.startsWith('data:') && !src.startsWith('blob:')) {
                imgSrc = `data:image/jpeg;base64,${src}`;
            }
            const img = new Image();
            img.crossOrigin = 'Anonymous';
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = imgSrc;
        });
    }
}