import { ForgeContext } from '../context/ForgeContext'
import { useContext } from 'react'
import '../styles/Login.scss'


const Login = (handleClick) => {
  const context = useContext(ForgeContext)

  if (!context) {
    throw new Error('ForgeContext must be used within a ForgeProvider')
  }

  const { currentAccount, connectWallet, disconnectWallet } = context

  return (
    <button
    className='login__button'
    onClick={!currentAccount ? connectWallet : disconnectWallet}
    >
      {!currentAccount ? 'Connect Wallet' : 'Disconnect Wallet'}
    </button>
  )
}

export default Login
