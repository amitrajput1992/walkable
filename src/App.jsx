import { useState, Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { Stats } from '@react-three/drei'
import './App.css'
import Scene from './components/scene/Scene'
import UI from './components/UI'

function App() {
  const [debug, setDebug] = useState(false)

  return (
    <div className="app">
      <Canvas shadows camera={{ position: [0, 5, 10], fov: 50 }}>
        <Suspense fallback={null}>
          <Scene debug={debug} />
        </Suspense>
        {debug && <Stats />}
      </Canvas>
      <UI debug={debug} setDebug={setDebug} />
    </div>
  )
}

export default App
