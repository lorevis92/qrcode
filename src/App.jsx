import Navbar from './components/Navbar'
import Footer from './components/Footer'
import QRGenerator from './pages/QRGenerator'

export default function App() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#FFFFFF' }}>
      <Navbar />
      <main style={{ flex: 1 }}>
        <QRGenerator />
      </main>
      <Footer />
    </div>
  )
}
