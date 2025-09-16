import { ForgeContext } from './context/ForgeContext'
import { ActionGroup, Login, UserInfo } from './components'
import { SnackbarProvider } from 'notistack'
import { useContext } from 'react'
import './styles/App.scss'


const App = () => {
  const context = useContext(ForgeContext)

  if (!context) {
    throw new Error('ForgeContext must be used within a ForgeProvider')
  }

  const { mintToken, forgeToken, tradeToken } = context

  return (
    <SnackbarProvider maxSnack={3}>
      <div className='App'>
        <UserInfo />
        <Login />
        <div className='container'>
          <ActionGroup
            buttonText='Mint ⛏️'
            executeFn={mintToken}
            tokenOptions={[0, 1, 2]}
          />
          <ActionGroup
            buttonText='Forge ⚒️'
            executeFn={forgeToken}
            tokenOptions={[3, 4, 5, 6]}
          />
        </div>
        <ActionGroup
          buttonText='Trade ⚖️'
          executeFn={tradeToken}
          tokenOptions={[0, 1, 2, 3, 4, 5, 6]}
          tokenOptions2={[0, 1, 2]}
        />
      </div>
    </SnackbarProvider>
  )
}

export default App
