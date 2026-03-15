import { Brand } from "@particle-academy/react-fancy";
import { DemoSection } from "../components/DemoSection";

function LogoIcon() {
  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500 text-white text-sm font-bold">
      P
    </div>
  );
}

export function BrandDemo() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Brand</h1>

      <DemoSection title="Basic" description="Logo with name and tagline." code={`<Brand
  logo={<LogoIcon />}
  name="Particle Academy"
  tagline="Learn to build"
/>`}>
        <Brand
          logo={<LogoIcon />}
          name="Particle Academy"
          tagline="Learn to build"
        />
      </DemoSection>

      <DemoSection title="Sizes" description="Small, medium, and large brand displays." code={`<Brand size="sm" logo={<LogoIcon />} name="Particle" tagline="Small" />
<Brand size="md" logo={<LogoIcon />} name="Particle" tagline="Medium" />
<Brand size="lg" logo={<LogoIcon />} name="Particle" tagline="Large" />`}>
        <div className="space-y-4">
          <Brand size="sm" logo={<LogoIcon />} name="Particle" tagline="Small" />
          <Brand size="md" logo={<LogoIcon />} name="Particle" tagline="Medium" />
          <Brand size="lg" logo={<LogoIcon />} name="Particle" tagline="Large" />
        </div>
      </DemoSection>

      <DemoSection title="Name Only" description="Without tagline or logo." code={`<Brand name="Particle Academy" />`}>
        <Brand name="Particle Academy" />
      </DemoSection>
    </div>
  );
}
