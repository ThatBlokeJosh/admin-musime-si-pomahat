// components/DonationsList.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy, limit, where } from 'firebase/firestore';
import { db } from '@/lib/firebase'; // Ensure this path is correct
import { Table, Column } from './Table';
import { GovButton, GovFormCheckbox, GovIcon, GovPagination } from '@gov-design-system-ce/react';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { exportDonationsToExcel } from '@/lib/xlsx';

// 1. Define Data Structure based on Firestore Schema
interface Donation {
  id: string;
  amount: number;
  variable_symbol: string;
  name: string;
  email: string;
  note: string;
  status: string;
  is_anonymous: boolean;
  for_company: boolean;
  other_details: string,
  not_public: boolean,
  // Allow price to be optional in case old data doesn't have it
  price?: {
    id: string;
    priceLabel: string;
    titleColor?: string; // e.g., "#D4AF37"
  };
  createdAt: string; // useful for sorting
}

export default function DonationsList() {
  const [data, setData] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);

  // --- NEW: Filter States ---
  const [searchTerm, setSearchTerm] = useState('');
  const [donorType, setDonorType] = useState('all'); // 'all' | 'company' | 'anonymous' | 'person'
  const ITEMS_PER_PAGE = 5;
  const [cancelledPage, setCancelledPage] = useState(1);
  const [paidPage, setPaidPage] = useState(1);
  const [pendingPage, setPendingPage] = useState(1);



  // 2. Fetch Data from Firestore
  useEffect(() => {
    const fetchData = async () => {
      try {
        const ref = collection(db, 'donations');
        // Order by newest first
        const q = query(ref, orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);

        const mappedData = snap.docs.map((doc) => {
          const d = doc.data();
          return {
            id: doc.id,
            ...d,
            // Ensure status has a fallback
            status: d.status || 'pending',
            // Ensure price object exists for rendering safety
            price: d.price || { priceLabel: `${d.amount} Kč` },
            other_details: `${d.adress}${d.birthdate ? ", " + d.birthdate : ''}${d.ico ? ", " + d.ico : ''}`
          } as Donation;
        });
        setData(mappedData);
      } catch (e) {
        console.error("Firebase Error:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // --- NEW: Filter Logic ---
  // We filter the raw data first, then split it into status categories
  const getFilteredData = () => {
    return data.filter((item) => {
      // 1. Text Search (Name OR Variable Symbol)
      const lowerTerm = searchTerm.toLowerCase();
      // Safety check: ensure properties exist before calling toLowerCase
      const nameMatch = (item.name || '').toLowerCase().includes(lowerTerm);
      const vsMatch = (item.variable_symbol || '').includes(lowerTerm);

      const matchesSearch = nameMatch || vsMatch;

      // 2. Type Filter
      let matchesType = true;
      if (donorType === 'company') {
        matchesType = item.for_company === true;
      } else if (donorType === 'anonymous') {
        matchesType = item.is_anonymous === true;
      } else if (donorType === 'person') {
        // Physical person is neither company nor anonymous
        matchesType = !item.for_company && !item.is_anonymous;
      }

      return matchesSearch && matchesType;
    });
  };

  // Get the filtered dataset
  const filteredGlobalData = getFilteredData();

  // Derive the status tables from the FILTERED data
  const paid = filteredGlobalData.filter(d => d.status === "paid");
  const pending = filteredGlobalData.filter(d => d.status === "pending");
  const cancelled = filteredGlobalData.filter(d => d.status === "cancelled");



  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      setData((prevData) =>
        prevData.map((item) =>
          item.id === id ? { ...item, status: newStatus } : item
        )
      );

      const donationRef = doc(db, 'donations', id);
      await updateDoc(donationRef, {
        status: newStatus
      });
      console.log(`Donation ${id} updated to ${newStatus}`);
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Nepodařilo se změnit status. Zkuste to prosím znovu.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Opravdu chcete tento dar smazat? Tato akce je nevratná.")) {
      return;
    }

    try {
      setData((prevData) => prevData.filter((item) => item.id !== id));
      await deleteDoc(doc(db, 'donations', id));
      console.log(`Donation ${id} deleted.`);
    } catch (error) {
      console.error("Error deleting document:", error);
      alert("Nepodařilo se smazat záznam.");
    }
  };

  function ExportButton(to_export: Donation[]) {
    // Disable export button if the list is empty (good UX)
    const isDisabled = to_export.length === 0;
    return (
      <GovButton
        onClick={() => { exportDonationsToExcel(to_export) }}
        type='outlined'
        color='primary'
        disabled={isDisabled}
      >
        <GovIcon name='export'></GovIcon>
        Exportovat
      </GovButton>
    )
  }


  // 3. Define Column Visuals
  const columns: Column<Donation>[] = [
    {
      header: "Dar",
      cell: (row) => {
        const baseColor = row.price?.titleColor || "#374151";
        const getRgba = (hex: string, alpha: number) => {
          const cleanHex = hex.replace('#', '');
          const r = parseInt(cleanHex.substring(0, 2), 16);
          const g = parseInt(cleanHex.substring(2, 4), 16);
          const b = parseInt(cleanHex.substring(4, 6), 16);
          return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        };

        return (
          <span
            className="inline-flex items-center px-3 py-1 rounded-lg text-sm font-semibold border"
            style={{
              color: baseColor,
              backgroundColor: getRgba(baseColor, 0.1),
              borderColor: getRgba(baseColor, 0.4)
            }}
          >
            {row.price?.id === "custom" ? `${row.amount} Kč` : row.price?.priceLabel}
          </span>
        );
      },
    },
    {
      header: "Variabilní symbol",
      cell: (row) => <span className="font-mono tabular-nums">{row.variable_symbol}</span>,
    },
    {
      header: "Jméno",
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="shrink-0">
            {row.is_anonymous ? (
              <img src={"/anon.svg"}></img>
            ) : row.for_company ? (
              <img src={"/company.svg"}></img>
            ) : (
              <img src={"/person.svg"}></img>
            )}
          </div>
          <span className={``}>
            {row.is_anonymous ? "" : row.name}
          </span>
        </div>
      ),
    },
    {
      header: "Status",
      cell: (row) => {
        const paidStyle = "bg-green-100 text-green-800";
        const pendingStyle = "bg-gray-200";
        const cancelledStyle = "bg-red-100 text-red-800"

        let label = row.status;
        let style = pendingStyle;
        if (row.status === 'pending') {
          label = 'nepotvrzeno';
          style = pendingStyle;
        } else if (row.status === 'paid') {
          label = 'potvrzeno'
          style = paidStyle;
        } else if (row.status === 'cancelled') {
          label = 'odmítnuto'
          style = cancelledStyle;
        };

        return (
          <span className={`inline-flex items-center px-3 py-1 rounded-md text-sm ${style}`}>
            {label}
          </span>
        );
      },
    },
    {
      header: "Email",
      cell: (row) => row.is_anonymous ? (
        <img src={"/anon.svg"}></img>
      ) : (
        <span className="">{row.email}</span>
      ),
    },
    {
      header: "Vzkaz",
      cell: (row) => (
        <div className="max-w-[200px] truncate" title={row.note}>
          {row.note || "—"}
        </div>
      ),
    },
    {
      header: "Další informace",
      cell: (row) => (
        <div className="" title={row.note}>
          {row.other_details || "—"}
        </div>
      ),
    },
    {
      header: "Neuvádět",
      cell: (row) => (
        <GovFormCheckbox className='pointer-events-none' size='s' defaultChecked={row.not_public}></GovFormCheckbox>
      ),
    },
    {
      header: "",
      cell: (row) => (
        <div className="flex gap-2">
          {(row.status === "pending" || row.status === "cancelled") && <GovButton onClick={async () => { await handleStatusChange(row.id, "paid") }} size='s' type='outlined' color='success'><GovIcon name='check-lg'></GovIcon></GovButton>}
          {row.status === "pending" && <GovButton onClick={async () => { await handleStatusChange(row.id, "cancelled") }} size='s' type='outlined' color='error'><GovIcon name='delete'></GovIcon></GovButton>}
        </div>
      ),
    },
  ];

  // 4. Render the final table
  return (
    <div className='w-full grid gap-4'>
      <div className="mb-8 bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="flex gap-2 flex-1">
          {/* Search Input */}
          <div className="relative w-full max-w-sm">
            <input
              type="text"
              placeholder="Hledat jméno nebo VS..."
              className="pl-4 pr-4 py-2 gov-form-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Type Filter */}
          <select
            className="px-2 w-fit gov-form-select max-w-[200px]"
            data-size="m"
            value={donorType}
            onChange={(e) => setDonorType(e.target.value)}
          >
            <option value="all">Všechny typy</option>
            <option value="person">Fyzické osoby</option>
            <option value="company">Firmy</option>
            <option value="anonymous">Anonymní</option>
          </select>
        </div>

        {/* Results Counter */}
        <div className="text-sm text-gray-500 font-medium whitespace-nowrap">
          Nalezeno: {filteredGlobalData.length}
        </div>
      </div>

      {/* --- Tables Grid --- */}
      <div className='w-full grid gap-8'>
        <Table<Donation>
          title={"K vyřešení"}
          description="Čekající dary, které je potřeba potvrdit nebo zamítnout."
          data={pending}
          columns={columns}
          isLoading={loading}
          header={ExportButton(pending)}
          totalCount={pending.length}
        />
        <Table<Donation>
          title={"Přehled darů"}
          description="Historie úspěšně potvrzených darů."
          header={ExportButton(paid)}
          data={paid}
          columns={columns}
          isLoading={loading}
          totalCount={paid.length}
        />
        <Table<Donation>
          title={"Odmítnuté - nepřišli"}
          description="Dary, které byly zamítnuty nebo zrušeny."
          data={cancelled}
          columns={columns}
          isLoading={loading}
          header={ExportButton(cancelled)}
          totalCount={cancelled.length}
        />
      </div>
    </div>
  );
}
