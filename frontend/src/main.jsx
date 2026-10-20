import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import App from './App';
import '../assets/styles.css';
import './styles.css';
import './workspace.css';

ReactDOM.createRoot(document.getElementById('root')).render(<>
  <div id="toast" className="toast" aria-live="polite" />
  <div id="modal" className="modal" hidden />
  <BrowserRouter><AuthProvider><App /></AuthProvider></BrowserRouter>
</>);
