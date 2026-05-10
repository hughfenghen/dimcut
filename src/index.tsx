import { render } from "solid-js/web";
import { I18nProvider } from "./i18n";
import LandingApp from "./landing/LandingApp.tsx";
import "./index.css";

const root = document.getElementById("root");
if (root) {
  render(
    () => (
      <I18nProvider>
        <LandingApp />
      </I18nProvider>
    ),
    root,
  );
}
