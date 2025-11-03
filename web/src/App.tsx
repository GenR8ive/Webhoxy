import { Router, Route } from "@solidjs/router";
import Home from "./pages/Home";
import Logs from "./pages/Logs";
import MappingsPage from "./pages/MappingsPage";

function App() {
  return (
    <Router>
      <Route path="/" component={Home} />
      <Route path="/logs" component={Logs} />
      <Route path="/mappings/:id" component={MappingsPage} />
    </Router>
  );
}

export default App;
