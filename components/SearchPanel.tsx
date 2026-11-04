import ProviderFilter from "@/components/ProviderFilter";
import type { ProviderStatus } from "@/lib/search";

/** Bočni panel sa filterima na strani rezultata. */
export default function SearchPanel({ providerStatus }: { providerStatus: ProviderStatus[] }) {
  return (
    <aside className="lm-panel p-5 lg:sticky lg:top-24">
      <ProviderFilter providerStatus={providerStatus} />
    </aside>
  );
}
