import { Routes, Route } from 'react-router-dom';
import Disqualified from './screens/Disqualified';
import LanguageDisqualified from './screens/LanguageDisqualified';
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Disqualified />} />
      <Route path="/language" element={<LanguageDisqualified />} />
    </Routes>
  );
}
