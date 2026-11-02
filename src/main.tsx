import ReactDOM from 'react-dom/client';
import App from './App';
import { preloadImage } from './components/BrandImage';
// Retain decoded images across chapter switches, independently of React mounts.
for (const src of ['/media/workflow/robert-martin.jpg', '/media/workflow/openai-blossom.svg', '/media/think-different-poster.jpg']) void preloadImage(src).catch(() => {});
import './styles.css';
import './components/site-details.css';
import './components/first-hero.css';
import './detail-polish.css';
import './brand-theme.css';

ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
