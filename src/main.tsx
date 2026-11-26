import { createRoot } from 'react-dom/client'
import App from '@/app/App.tsx'
import '@/styles.css'

const root = document.getElementById('root')
if (!root) throw new Error('No se encontró el contenedor de la extensión')
createRoot(root).render(<App />)
