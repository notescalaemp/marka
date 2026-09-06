import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { SocialProof } from "@/components/SocialProof";
import { Workflow } from "@/components/Workflow";
import { Positioning } from "@/components/Positioning";
import { Numbers } from "@/components/Numbers";
import { Sectors } from "@/components/Sectors";
import { DemoForm } from "@/components/DemoForm";
import { FinalCta } from "@/components/FinalCta";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <SocialProof />
        <Workflow />
        <Positioning />
        <Numbers />
        <Sectors />
        <DemoForm />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}
