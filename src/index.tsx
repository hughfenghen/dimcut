import { render } from "solid-js/web";
import LandingApp from "./landing/LandingApp.tsx";
import "./index.css";

const root = document.getElementById("root");
if (root) {
  render(() => <LandingApp />, root);
}
