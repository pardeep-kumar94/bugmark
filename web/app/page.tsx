import { Nav } from '@/components/Nav';
import { Hero } from '@/components/Hero';
import { Included } from '@/components/Included';
import { Showcase } from '@/components/Showcase';
import { DevContext } from '@/components/DevContext';
import { Workflow } from '@/components/Workflow';
import { HowItWorks } from '@/components/HowItWorks';
import { Features } from '@/components/Features';
import { UseCases } from '@/components/UseCases';
import { Privacy } from '@/components/Privacy';
import { Free } from '@/components/Free';
import { FAQ } from '@/components/FAQ';
import { Explore } from '@/components/Explore';
import { CTA } from '@/components/CTA';
import { Footer } from '@/components/Footer';
import { JsonLd, homeGraph } from '@/lib/seo';

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Included />
        <HowItWorks />
        <Showcase />
        <DevContext />
        <Workflow />
        <Features />
        <UseCases />
        <Privacy />
        <Free />
        <FAQ />
        <Explore />
        <CTA />
      </main>
      <Footer />
      <JsonLd data={homeGraph()} />
    </>
  );
}
