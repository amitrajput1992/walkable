import React from 'react'

const UI = ({ debug, setDebug }) => {
  return (
    <div className="ui-overlay">
      <div className="controls">
        <button onClick={() => setDebug(!debug)}>
          {debug ? 'Hide Debug' : 'Show Debug'}
        </button>
      </div>
    </div>
  )
}

export default UI
