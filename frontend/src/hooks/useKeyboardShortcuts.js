import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

/**
 * Global Keyboard Shortcuts for KrushiMitra AI
 * F1: Help / AI Assistant
 * F2: POS Billing
 * F3: Search Products
 * F4: New Purchase Entry
 * F11: Fullscreen
 */
export const useKeyboardShortcuts = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't intercept if user is typing in an input, textarea, etc.
      // (Unless it's a specific function key that we want to globally override)
      const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName);

      if (e.key === 'F2') {
        e.preventDefault();
        navigate('/pos');
      } else if (e.key === 'F3') {
        e.preventDefault();
        navigate('/products');
        // We could also dispatch a custom event to focus the search bar
        setTimeout(() => {
          const searchInput = document.querySelector('input[placeholder*="Search"]');
          if (searchInput) searchInput.focus();
        }, 100);
      } else if (e.key === 'F4') {
        e.preventDefault();
        navigate('/inventory/purchase');
      } else if (e.key === 'F1') {
        e.preventDefault();
        // Toggle AI Assistant (trigger custom event or manage state in layout)
        window.dispatchEvent(new CustomEvent('toggle-ai-assistant'));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);
};
