import DashboardPageHeader from "@/components/dashboard/PageHeader";
import { PlaceHolderImages } from "@/lib/placeholder-images";

export default function ProjectManualPage() {
  const image = PlaceHolderImages.find(p => p.id === 'project-manual');

  return (
    <div>
      <DashboardPageHeader
        title="Project Manual"
        description="Access and manage the project manual."
        imageUrl={image?.imageUrl || ''}
        imageHint={image?.imageHint || ''}
      />
    </div>
  );
}
