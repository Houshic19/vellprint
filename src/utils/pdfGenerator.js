const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

function generateInvoicePDF(enquiryData, enquiryId) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const filename = `Quote-${enquiryId}-${Date.now()}.pdf`;
      const filePath = path.join(__dirname, '../../public/uploads', filename);

      const writeStream = fs.createWriteStream(filePath);
      doc.pipe(writeStream);

      // Header - Logo and Company Info
      const logoPath = path.join(__dirname, '../../public/logo.png');
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, 50, 45, { width: 150 });
      }

      doc.fillColor('#444444')
         .fontSize(20)
         .text('PROFORMA INVOICE', 50, 160);

      doc.fontSize(10)
         .text('Vell Print Technology', 50, 185)
         .text('123 Business Road, Print City, India', 50, 200)
         .text('Email: info@vellprint.com | Phone: +91 98948 33377', 50, 215);

      // Customer Details
      doc.text(`Enquiry ID: #${enquiryId}`, 400, 185)
         .text(`Date: ${new Date().toLocaleDateString('en-IN')}`, 400, 200)
         .text(`To: ${enquiryData.business_name}`, 400, 215)
         .text(`Attn: ${enquiryData.dealer_name}`, 400, 230)
         .text(`Phone: ${enquiryData.phone}`, 400, 245);

      if (enquiryData.gst) {
        doc.text(`GST: ${enquiryData.gst}`, 400, 260);
      }

      doc.moveDown(3);

      // Items Table
      doc.fontSize(12).text('Requested Items Summary:', 50, 300);
      doc.fontSize(10).text(enquiryData.items_summary, 50, 320, { width: 500, align: 'left' });

      doc.moveDown(2);
      if (enquiryData.delivery_location) {
        doc.text(`Delivery Location: ${enquiryData.delivery_location}`);
      }
      if (enquiryData.remarks) {
        doc.moveDown();
        doc.text(`Remarks: ${enquiryData.remarks}`);
      }

      doc.moveDown(4);
      doc.fontSize(10).text('This is a computer-generated proforma invoice/quote and does not require a physical signature.', 50, 700, { align: 'center', width: 500 });

      doc.end();

      writeStream.on('finish', () => {
        resolve(`/uploads/${filename}`);
      });
      writeStream.on('error', reject);

    } catch (err) {
      reject(err);
    }
  });
}

module.exports = { generateInvoicePDF };
