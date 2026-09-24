import { HashRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import ListPage from "./pages/ListPage.jsx";
import DetailPage from "./pages/DetailPage.jsx";
import TeamPage from "./pages/TeamPage.jsx";
import BagAndMartPage from "./pages/BagAndMartPage.jsx";
import WildernessPage from "./pages/WildernessPage.jsx";
import GymPage from "./pages/GymPage.jsx";
import NotFoundPage from "./pages/NotFoundPage.jsx";
import PlaceholderPage from "./pages/PlaceholderPage.jsx";
import StarterModal from "./components/StarterModal.jsx";
import { IconScale } from "./components/Icons.jsx";

function App() {
  return (
    <HashRouter>
      <StarterModal />
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<ListPage />} />
          <Route path="/pokemon/:name" element={<DetailPage />} />
          <Route path="/team" element={<TeamPage />} />
          <Route path="/bag" element={<BagAndMartPage />} />
          <Route path="/wilderness" element={<WildernessPage />} />
          <Route path="/gym" element={<GymPage />} />
          <Route path="/battle" element={<GymPage />} />

          <Route
            path="/compare"
            element={
              <PlaceholderPage
                title="Pro Comparison Tool"
                stage="Stage 6"
                icon={IconScale}
                description="Compare any two Pokémon head-to-head with stat visualization and type advantage analysis."
                features={[
                  "Side-by-side base stat comparison bars",
                  "Type matchup calculator (Super Effective / Weaknesses)",
                  "Movepool overlap and physical trait analysis",
                ]}
              />
            }
          />

          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}

export default App;
