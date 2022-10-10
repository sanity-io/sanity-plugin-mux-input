import {Suspense} from 'react'
import Video from './Video'
import './App.css'

function App() {
  return (
    <div className="App">
      <Suspense
        fallback={
          <svg className="spinner" viewBox="0 0 50 50">
            <circle className="path" cx="25" cy="25" r="20" fill="none" strokeWidth="5"></circle>
          </svg>
        }
      >
        <Video />
      </Suspense>
    </div>
  )
}

export default App
