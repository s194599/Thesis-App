import jsPDF from 'jspdf';
import 'jspdf-autotable';

/**
 * Generate a PDF from a quiz object
 * @param {Object} quiz - The quiz object
 * @returns {jsPDF} - The PDF document
 */
export const generateQuizPDF = (quiz) => {
  // Create a new PDF document
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Add title
  doc.setFontSize(20);
  doc.text(quiz.title || 'Quiz', pageWidth / 2, 20, { align: 'center' });
  
  // Add description if available
  if (quiz.description) {
    doc.setFontSize(12);
    doc.text(quiz.description, pageWidth / 2, 30, { align: 'center' });
  }
  
  // Process each question
  let yPos = quiz.description ? 45 : 35;
  
  quiz.questions.forEach((question, qIndex) => {
    // Ensure we have enough space for the question
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }
    
    // Add question number and text
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text(`Question ${qIndex + 1}:`, 10, yPos);
    doc.setFont(undefined, 'normal');
    doc.text(question.question, 10, yPos + 7);
    
    // Add options
    yPos += 15;
    
    // Check if question has multiple correct answers (array) or single (string)
    const correctAnswers = Array.isArray(question.correctAnswers) 
      ? question.correctAnswers 
      : [question.correctAnswer];
    
    // Add options as a table
    const optionsData = question.options.map((option, index) => {
      const isCorrect = correctAnswers.includes(option);
      return [
        String.fromCharCode(65 + index) + '.', // A, B, C, D...
        option,
        isCorrect ? '✓' : ''
      ];
    });
    
    doc.autoTable({
      startY: yPos,
      head: [['', 'Options', 'Correct']],
      body: optionsData,
      theme: 'striped',
      headStyles: { fillColor: [100, 100, 100] },
      columnStyles: {
        0: { cellWidth: 15 },
        2: { cellWidth: 20, halign: 'center' }
      },
      styles: {
        overflow: 'linebreak',
        cellPadding: 3,
      }
    });
    
    yPos = doc.lastAutoTable.finalY + 10;
    
    // Add explanation if available
    if (question.explanation) {
      doc.setFontSize(10);
      doc.setFont(undefined, 'italic');
      doc.text('Explanation: ' + question.explanation, 10, yPos, {
        maxWidth: pageWidth - 20
      });
      
      // Calculate height of explanation text
      const textLines = doc.splitTextToSize(question.explanation, pageWidth - 30);
      yPos += 5 + (textLines.length * 3.5);
    }
    
    yPos += 10; // Space between questions
  });
  
  // Add footer with date
  const dateStr = new Date().toLocaleDateString();
  doc.setFontSize(8);
  doc.text(`Generated on ${dateStr}`, pageWidth - 15, doc.internal.pageSize.getHeight() - 10, { align: 'right' });
  
  return doc;
};

/**
 * Download a quiz as PDF
 * @param {Object} quiz - The quiz object
 */
export const downloadQuizPDF = (quiz) => {
  const doc = generateQuizPDF(quiz);
  doc.save(`${quiz.title || 'Quiz'}.pdf`);
}; 