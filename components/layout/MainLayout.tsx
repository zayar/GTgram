import EmbeddedLayout from '@/components/layout/EmbeddedLayout';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  // Use the embedded layout without navigation bars
  return <EmbeddedLayout>{children}</EmbeddedLayout>;
} 