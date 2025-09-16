import { ForgeContext } from '../context/ForgeContext'
import { useContext, useEffect, useState } from 'react'
import '../styles/UserInfo.scss'


const UserInfo = () => {
  const context = useContext(ForgeContext)

  if (!context) {
    throw new Error('ForgeContext must be used within a ForgeProvider')
  }

  const { currentAccount, getBalances } = context
  const [balances, setBalances] = useState([])

  useEffect(() => {
    const fetchBalances = async () => {
      if (!currentAccount) return
      try {
        const result = await getBalances(currentAccount)
        setBalances(result)
      } catch (error) {
        console.log(error)
      }
    }

    fetchBalances()
  }, [currentAccount, getBalances])
  
  return (
    <div className='balances'>
      <h1>
        <a href='https://testnets.opensea.io/collection/void-elementals-2' target='_blank' rel='noopener noreferrer'>
          Void Elementals
        </a>
      </h1>
      {currentAccount ? balances?.length > 0 && balances[0] !== undefined ? (
        <table>
          <tbody>
            <tr>
              <td>Kurogawa: {parseInt(balances[0])}</td>
              <td>Enbu: {parseInt(balances[1])}</td>
              <td>Retsu: {parseInt(balances[2])}</td>
            </tr>
            <tr>
              <td>Raijuu: {parseInt(balances[3])}</td>
              <td>Shigane: {parseInt(balances[4])}</td>
              <td>Doron: {parseInt(balances[5])}</td>
            </tr>
            <tr>
              <td>Fuujin: {parseInt(balances[6])}</td>
            </tr>
          </tbody>
        </table>
      ) : (
        <p>Loading balances...</p>
      ): null}
    </div>
  )
}

export default UserInfo