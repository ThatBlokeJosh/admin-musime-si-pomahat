// components/DonationsList.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy, limit, where } from 'firebase/firestore';
import { db } from '@/lib/firebase'; // Ensure this path is correct
import { Table, Column } from './Table';
import { GovButton, GovFormCheckbox, GovIcon } from '@gov-design-system-ce/react';
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

  const paid = data.filter(d => d.status === "paid");
  const pending = data.filter(d => d.status === "pending");
  const cancelled = data.filter(d => d.status === "cancelled");

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
    return <GovButton onClick={() => { exportDonationsToExcel(to_export) }} type='outlined' color='primary'><GovIcon name='export'></GovIcon>Exportovat</GovButton>
  }


  // 3. Define Column Visuals (The critical part for matching the image)
  const columns: Column<Donation>[] = [
    {
      header: "Dar",
      cell: (row) => {
        // 1. Get the color from the price object, fallback to a neutral gray
        const baseColor = row.price?.titleColor || "#374151";

        // 2. Helper: Convert Hex to RGBA string with opacity
        const getRgba = (hex: string, alpha: number) => {
          const cleanHex = hex.replace('#', '');
          const r = parseInt(cleanHex.substring(0, 2), 16);
          const g = parseInt(cleanHex.substring(2, 4), 16);
          const b = parseInt(cleanHex.substring(4, 6), 16);
          // Returns valid CSS color, e.g., "rgba(212, 175, 55, 0.1)"
          return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        };

        return (
          <span
            className="inline-flex items-center px-3 py-1 rounded-lg text-sm font-semibold border"
            style={{
              color: baseColor,
              // Match your previous design: Background 10% opacity, Border 40% opacity
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
      // Using tabular-nums ensures numbers line up vertically nicely
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

        // 2. Define Styles based on the screenshot
        // Paid = Green background/text

        const isPaid = row.status === 'paid';

        return (
          <span className={`inline-flex items-center px-3 py-1 rounded-md text-sm
            ${style}`}>
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
      // Truncate long messages so they don't break the table layout
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
          {row.status != "cancelled" && <GovButton onClick={async () => { await handleStatusChange(row.id, "cancelled") }} size='s' type='outlined' color='error'><GovIcon name='delete'></GovIcon></GovButton>}
        </div>
      ),
    },
  ];

  // 4. Render the final table
  return (
    <div className='w-full grid gap-8'>
      <Table<Donation>
        title={"K vyřešení"}
        description="Základní datová tabulka s možností akce s daným řádkem"
        data={pending}
        columns={columns}
        isLoading={loading}
        header={ExportButton(pending)}
        totalCount={pending.length}
      />
      <Table<Donation>
        title={"Přehled darů"}
        description="Základní datová tabulka s možností akce s daným řádkem"
        header={ExportButton(paid)}
        data={paid}
        columns={columns}
        isLoading={loading}
        totalCount={paid.length}
      />
      <Table<Donation>
        title={"Odmítnuté - nepřišli"}
        description="Základní datová tabulka s možností akce s daným řádkem"
        data={cancelled}
        columns={columns}
        isLoading={loading}
        header={ExportButton(cancelled)}
        totalCount={cancelled.length}
      />
    </div>
  );
}
