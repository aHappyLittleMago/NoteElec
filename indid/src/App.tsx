import './App.css'
import { Demo } from './components/demoEntity'
import { ServerModule } from './components/startServer'

function App() {
  return (
    <>
      <ServerModule/>
      <Demo/>
    </>
  )
}

export default App
