import './App.css'
import BicepCounter from './BicepCounter'

function App() {
  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      background: '#000',
      overflow: 'hidden',
      margin: 0,
      padding: 0,
      boxSizing: 'border-box'
    }}>
      <BicepCounter />
    </div>
  )
}

export default App
