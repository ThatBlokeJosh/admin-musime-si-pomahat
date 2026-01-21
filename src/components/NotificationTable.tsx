'use client';

import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase'; // Ensure this path is correct
import { Table, Column } from './Table';
import { GovButton, GovDialog, GovFormControl, GovFormInput, GovFormLabel, GovIcon } from '@gov-design-system-ce/react';

// 1. Define Data Structure
interface Notification {
  id: string;
  email: string;
  createdAt?: any;
}

export default function NotificationList() {
  const [data, setData] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 2. Fetch Data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const ref = collection(db, 'notifications');
        // Order by newest first
        const q = query(ref, orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);

        const mappedData = snap.docs.map((doc) => ({
          id: doc.id,
          email: doc.data().email,
          createdAt: doc.data().createdAt
        } as Notification));

        setData(mappedData);
      } catch (e) {
        console.error("Firebase Error:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // 3. Handle Add (Create)
  const handleAddEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newEmail.includes('@')) {
      alert("Prosím zadejte platný email.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Add to Firestore
      const docRef = await addDoc(collection(db, 'notifications'), {
        email: newEmail,
        createdAt: serverTimestamp()
      });

      // Optimistic UI Update (add to top of list)
      const newItem: Notification = {
        id: docRef.id,
        email: newEmail,
        createdAt: new Date()
      };
      setData(prev => [newItem, ...prev]);

      // Reset and Close
      setNewEmail('');
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error adding document: ", error);
      alert("Nepodařilo se uložit email.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 4. Handle Delete
  const handleDelete = async (id: string) => {
    if (!window.confirm("Opravdu chcete tento email smazat ze seznamu?")) {
      return;
    }

    try {
      // Optimistic UI Update
      setData((prevData) => prevData.filter((item) => item.id !== id));
      // Delete from Firestore
      await deleteDoc(doc(db, 'notifications', id));
    } catch (error) {
      console.error("Error deleting document:", error);
      alert("Nepodařilo se smazat záznam.");
    }
  };

  // 5. Define Columns
  const columns: Column<Notification>[] = [
    {
      header: "Email",
      cell: (row) => (
        <div className="flex items-center gap-3">
          <span className="font-medium text-gray-900">{row.email}</span>
        </div>
      ),
    },
    {
      header: "",
      className: "w-24 text-right", // Align buttons to right
      cell: (row) => (
        <div className="flex justify-end">
          <GovButton
            onClick={async () => { await handleDelete(row.id) }}
            size='s'
            type='outlined'
            color='error'
          >
            <GovIcon name='delete' />
          </GovButton>
        </div>
      ),
    },
  ];

  return (
    <div className='w-full'>
      <Table<Notification>
        title={"Notifikace"}
        description="Seznam emailů, na které budou chodit upozornění."
        data={data}
        columns={columns}
        isLoading={loading}
        totalCount={data.length}
        footer={
          <GovButton
            size='s'
            color='neutral'
            type='base'
            onClick={() => setIsModalOpen(true)}
          >
            <GovIcon name='add' />
            Přidat dalšího člena
          </GovButton>
        }
      />

      {/* --- Simple Modal --- */}
      {isModalOpen && (
        <GovDialog
          onClose={() => { setIsModalOpen(false) }}
          title={(<h2>Přidat nový email</h2>)}
          open={isModalOpen}>
          <form onSubmit={handleAddEmail}>
            <div className="grid gap-2">
              <p className="text-sm text-gray-500">Zadejte emailovou adresu příjemce notifikací.</p>

              <GovFormControl className="">
                <GovFormLabel>
                  Emailová adresa
                </GovFormLabel>
                <GovFormInput
                  size='m'
                  autoFocus
                  id="email"
                  type="email"
                  placeholder="jan.novak@example.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                />
              </GovFormControl>

              <div style={{ "marginTop": "12px" }} className=" flex gap-2 justify-end">
                <GovButton
                  nativeType="submit"
                  type='solid'
                  color='primary'
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting ? 'Ukládám...' : 'Uložit email'}
                </GovButton>
              </div>
            </div>
          </form>
        </GovDialog>
      )}
    </div>
  );
}
