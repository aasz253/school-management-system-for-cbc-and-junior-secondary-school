import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export function exportToPDF(students) {
  const doc = new jsPDF()
  const currentDate = new Date()
  const formattedDate = currentDate.toLocaleDateString('en-GB', { 
    day: '2-digit', month: 'long', year: 'numeric' 
  })
  const formattedTime = currentDate.toLocaleTimeString('en-GB', { 
    hour: '2-digit', minute: '2-digit' 
  })
  
  doc.setFontSize(20)
  doc.setTextColor(0, 51, 102)
  doc.text('Smart School Academy', 105, 20, { align: 'center' })
  
  doc.setFontSize(14)
  doc.setTextColor(100)
  doc.text('Student Report', 105, 30, { align: 'center' })
  
  doc.setFontSize(10)
  doc.text(`Generated: ${formattedDate} at ${formattedTime}`, 105, 38, { align: 'center' })
  
  const tableData = students.map(s => [
    s.full_name,
    s.admission_no,
    `Grade ${s.grade}`,
    `KES ${s.fee_paid.toLocaleString()}`
  ])
  
  autoTable(doc, {
    head: [['Name', 'Admission No.', 'Grade', 'Fees (KES)']],
    body: tableData,
    startY: 45,
    theme: 'grid',
    headStyles: {
      fillColor: [0, 51, 102],
      textColor: 255,
      fontStyle: 'bold'
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    styles: {
      fontSize: 10,
      cellPadding: 5
    },
    columnStyles: {
      0: { cellWidth: 60 },
      1: { cellWidth: 40 },
      2: { cellWidth: 25 },
      3: { cellWidth: 30, halign: 'right' }
    }
  })
  
  const finalY = doc.lastAutoTable.finalY + 10
  doc.setFontSize(10)
  doc.setTextColor(100)
  doc.text(`Total Students: ${students.length}`, 14, finalY)
  doc.text(`Total Fees: KES ${students.reduce((a, b) => a + b.fee_paid, 0).toLocaleString()}`, 14, finalY + 6)
  
  doc.setFontSize(8)
  doc.setTextColor(150)
  doc.text(`Report Generated: ${formattedDate} at ${formattedTime} - SIFUNA CODEX COMPANY`, 105, 285, { align: 'center' })
  
  const dateStr = `${currentDate.getFullYear()}${String(currentDate.getMonth()+1).padStart(2,'0')}${String(currentDate.getDate()).padStart(2,'0')}`
  doc.save(`student-report-${dateStr}.pdf`)
}

export function exportToKEMIS(students, format) {
  const currentDate = new Date()
  const formattedDate = currentDate.toLocaleDateString('en-GB', { 
    day: '2-digit', month: 'long', year: 'numeric' 
  })
  const formattedTime = currentDate.toLocaleTimeString('en-GB', { 
    hour: '2-digit', minute: '2-digit' 
  })
  
  const kemisData = students.map(s => ({
    name: s.full_name,
    admission_no: s.admission_no,
    grade: s.grade,
    gender: s.gender,
    date_of_birth: s.date_of_birth || '',
    guardian_name: s.guardian_name,
    guardian_contact: s.guardian_contact || ''
  }))
  
  const metadata = {
    school_name: 'Smart School Academy',
    export_date: `${formattedDate} at ${formattedTime}`,
    total_students: kemisData.length,
    kemis_version: '1.0',
    curriculum: 'CBC'
  }
  
  const exportData = {
    metadata,
    students: kemisData
  }
  
  const dateStr = `${currentDate.getFullYear()}${String(currentDate.getMonth()+1).padStart(2,'0')}${String(currentDate.getDate()).padStart(2,'0')}`
  
  if (format === 'json') {
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    downloadFile(blob, `kemis-data-${dateStr}.json`)
  } else if (format === 'csv') {
    const headers = ['name', 'admission_no', 'grade', 'gender', 'date_of_birth', 'guardian_name', 'guardian_contact']
    const csvContent = [
      headers.join(','),
      ...kemisData.map(s => headers.map(h => `"${s[h] || ''}"`).join(','))
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    downloadFile(blob, `kemis-data-${dateStr}.csv`)
  }
}

function downloadFile(blob, filename) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
