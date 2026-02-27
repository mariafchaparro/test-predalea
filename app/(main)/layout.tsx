import BottomNav from '@/components/BottomNav';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh max-w-[600px] mx-auto relative bg-white">
      <main className="pb-20">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
