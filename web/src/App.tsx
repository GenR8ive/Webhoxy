import { Router, Route } from "@solidjs/router";
import Home from "./pages/Home";
import Logs from "./pages/Logs";
import MappingsPage from "./pages/MappingsPage";
import Login from "./pages/Login";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <Router>
      <Route path="/login" component={Login} />
      <Route path="/" component={() => (
        <ProtectedRoute>
          <Home />
        </ProtectedRoute>
      )} />
      <Route path="/logs" component={() => (
        <ProtectedRoute>
          <Logs />
        </ProtectedRoute>
      )} />
      <Route path="/mappings/:id" component={() => (
        <ProtectedRoute>
          <MappingsPage />
        </ProtectedRoute>
      )} />
    </Router>
  );
}

export default App;
