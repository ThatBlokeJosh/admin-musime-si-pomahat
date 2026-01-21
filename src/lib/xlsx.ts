// utils/exportDonations.ts
import * as XLSX from 'xlsx';

// Define the Interface here (or import it if you have a shared types file)
export interface DonationForExport {
  id: string;
  amount: number;
  variable_symbol: string;
  name: string;
  email: string;
  note: string;
  status: string;
  is_anonymous: boolean;
  for_company: boolean;
  price?: {
    id: string;
    priceLabel: string;
  };
  other_details: string;
  not_public: boolean;
  createdAt: any; // Can be Firestore Timestamp or Date
}

export const exportDonationsToExcel = (data: DonationForExport[]) => {
  // 1. Transform data for Excel
  const exportData = data.map((row) => {
    // A. Date Parsing Logic (Handle Firestore Timestamp vs Date string)
    let dateStr = '';
    if (row.createdAt) {
      if (typeof row.createdAt === 'object' && 'seconds' in row.createdAt) {
        // Firestore Timestamp
        dateStr = new Date(row.createdAt.seconds * 1000).toLocaleString('cs-CZ');
      } else {
        // JS Date or String
        dateStr = new Date(row.createdAt).toLocaleString('cs-CZ');
      }
    }

    let typeLabel = 'Fyzická osoba';
    if (row.for_company) typeLabel = 'Firma';
    if (row.is_anonymous) typeLabel = 'Anonymní dárce';

    // D. Return the formatted row
    return {
      "Variabilní symbol": row.variable_symbol,
      "Částka": row.price?.id === "custom" ? `${row.amount} Kč` : row.price?.priceLabel,
      "Jméno": row.name,
      "Email": row.email,
      "Typ dárce": typeLabel,
      "Vzkaz": row.note || "",
      "Další informace": row.other_details || "",
      "Neuvádět dárce": row.not_public ? "Ano" : "Ne",
      "Čas odeslání": dateStr
    };
  });

  // 2. Create Sheet
  const ws = XLSX.utils.json_to_sheet(exportData);

  // 3. Set Column Widths (Optional but good for UX)
  ws['!cols'] = [
    { wch: 15 }, // VS
    { wch: 25 }, // Amount
    { wch: 25 }, // Name
    { wch: 30 }, // Email
    { wch: 20 }, // Type
    { wch: 45 }, // Note
    { wch: 30 }, // Other details
    { wch: 15 }, // Not public 
    { wch: 20 }, // Date
  ];

  // 4. Create Workbook and Download
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Dary");

  const fileName = `Prehled_daru_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, fileName);
};
