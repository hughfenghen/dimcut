import { type Component } from "solid-js";
import { Nav } from "./Nav.tsx";
import { Hero } from "./Hero.tsx";
import { Concept } from "./Concept.tsx";
import { DemoSection } from "./DemoSection.tsx";
import { Footer } from "./Footer.tsx";

const LandingApp: Component = () => {
  return (
    <div class="bg-[--color-bg] text-[--color-fg]">
      <Nav />
      <main>
        <Hero />
        <Concept />
        <DemoSection />
      </main>
      <Footer />
    </div>
  );
};

export default LandingApp;
