import { render } from "solid-js/web";
import App from "./demo/App.tsx";
import "./index.css";

const root = document.getElementById("root");
if (root) {
  render(() => <App />, root);
}
