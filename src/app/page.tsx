import DonationsList from "@/components/DonationTable";
import NotificationList from "@/components/NotificationTable";

export default function Home() {
  return (
    <main className="w-[100vw] grid gap-8 py-8 px-16 items-center">
      <DonationsList></DonationsList>
      <NotificationList></NotificationList>
    </main>
  );
}
