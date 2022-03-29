import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import AppNav from '../components/navigation'
import { Notifier } from '../components/notifications'
import HomePage from '../domain/home'
import ConfigurationPage from '../domain/configuration'
import AccountsPage from '../domain/accounts'

function App() {
    return (
        <Router>
            <Notifier>
                <AppNav />
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="configuration" element={<ConfigurationPage />} />
                    <Route path="configuration/:nodeGrp" element={<ConfigurationPage />} />
                    <Route path="configuration/:nodeGrp/:nodeID" element={<ConfigurationPage />} />
                    <Route path="accounts" element={<AccountsPage />} />
                    <Route path="accounts/:accountID" element={<AccountsPage />} />
                </Routes>
            </Notifier>
        </Router>
    );
}

export default App;
