import { InteractivePage } from "./pages/InteractivePage";
import { RecordingPage } from "./pages/RecordingPage";

export default function App() {
  return window.location.pathname === "/recording" ? (
    <RecordingPage />
  ) : (
    <InteractivePage />
  );
}
