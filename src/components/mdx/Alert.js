import React from 'react'

const Alert = ({ title, type, children }) => {
  return (
    <div className={`alert alert-${type}`}>
      <h4 className={type}>{title}</h4>
      <p>{children}</p>
    </div>
  )
}

export default Alert
