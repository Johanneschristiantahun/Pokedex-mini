import { HashRouter, Routes, Route } from "react-router-dom";
import { useGame } from "./context/GameContext.jsx";
import Layout from "./components/Layout.jsx";
import ListPage from "./pages/ListPage.jsx";
import DetailPage from "./pages/DetailPage.jsx";
import TeamPage from "./pages/TeamPage.jsx";
import BagAndMartPage from "./pages/BagAndMartPage.jsx";
import WildernessPage from "./pages/WildernessPage.jsx";
import GymPage from "./pages/GymPage.jsx";
import LeaguePage from "./pages/LeaguePage.jsx";
import ComparePage from "./pages/ComparePage.jsx";
import NotFoundPage from "./pages/NotFoundPage.jsx";
import StarterModal from "./components/StarterModal.jsx";
import EvolutionModal from "./components/EvolutionModal.jsx";

function App() {
  const { pendingEvolution, completeEvolution, cancelEvolution } = useGame();

  return (
    <HashRouter>
      <StarterModal />
      <EvolutionModal
        pendingEvolution={pendingEvolution}
        onComplete={completeEvolution}
        onCancel={cancelEvolution}
      />
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<ListPage />} />
          <Route path="/pokemon/:name" element={<DetailPage />} />
          <Route path="/team" element={<TeamPage />} />
          <Route path="/bag" element={<BagAndMartPage />} />
          <Route path="/wilderness" element={<WildernessPage />} />
          <Route path="/gym" element={<GymPage />} />
          <Route path="/battle" element={<GymPage />} />
          <Route path="/league" element={<LeaguePage />} />
          <Route path="/championship" element={<LeaguePage />} />
          <Route path="/compare" element={<ComparePage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}

export default App;
