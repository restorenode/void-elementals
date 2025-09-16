import { ForgeContext } from '../context/ForgeContext'
import React, { useContext, useEffect, useState } from 'react'
import '../styles/ActionGroup.scss'

type MintableToken = 0 | 1 | 2
type ForgeableToken = 3 | 4 | 5 | 6
type TradeableToken = 0 | 1 | 2 | 3 | 4 | 5 | 6
type ExecuteFnType = 
  | ((selectedValue: MintableToken) => void)
  | ((selectedValue: ForgeableToken) => void)
  | ((selectedValue: TradeableToken, askToken: MintableToken) => void)


type ActionGroupProps = {
  buttonText: string
  executeFn: ExecuteFnType
  tokenOptions: MintableToken[] | ForgeableToken[] | TradeableToken[]
  tokenOptions2?: MintableToken[]
}

const ActionGroup: React.FC<ActionGroupProps> = ({ buttonText, executeFn, tokenOptions,  tokenOptions2 }) => {
  const context = useContext(ForgeContext)

  if (!context) {
    throw new Error('ForgeContext must be used within a ForgeProvider')
  }

  const { currentAccount, loading } = context

  const [selectedValue, setSelectedValue] = useState<MintableToken | ForgeableToken>(tokenOptions[0])
  const [askToken, setAskToken] = useState<MintableToken | undefined>(tokenOptions2 ? tokenOptions2[0] : undefined)
  const [hourglass, setHourglass] = useState<string>('⏳')

  useEffect(() => {
    if (loading) {
      const interval = setInterval(() => {
        setHourglass((prev) => (prev === '⏳' ? '⌛' : '⏳'))
      }, 500)

      return () => clearInterval(interval)
    }
  }, [loading])

  const handleChange = (index: MintableToken | ForgeableToken) => {
    setSelectedValue(index)
  }

  const handleAskTokenChange = (index: MintableToken) => {
    setAskToken(index)
  }

  const handleClick = () => {
    if (tokenOptions2) {
      (executeFn as (selectedValue: TradeableToken, askToken: MintableToken) => void)(
        selectedValue as TradeableToken,
        askToken as MintableToken
      )
    } else {
      (executeFn as (selectedValue: MintableToken | ForgeableToken) => void)(selectedValue)
    }
  }

  return (
    <div className='action__group'>
      <div className='image__container'>
        <div>
          {
            tokenOptions.map((index) => (
              <img
                className={`image__option ${selectedValue === index ? 'image__selected' : ''}`}
                src={`/src/image-data/void-elementals/${index}.jpg`}
                alt={`${index}`}
                width={200}
                height={200}
                onClick={() => handleChange(index)}
                key={index}
              />
            ))
            
          }
        </div>
        {tokenOptions2 && (
          <div className='trade__icon'>
            <svg
              xmlns='http://www.w3.org/2000/svg'
              viewBox='0 0 24 24'
              height='150'
              fill='currentColor'
            >
              <path d='M16 3v2H5.41l5.3 5.29-1.42 1.42L3 6.41V15h2V7h11v2l4-4-4-4zM8 21v-2h10.59l-5.3-5.29 1.42-1.42L21 17.59V9h-2v8H8v-2l-4 4 4 4z' />
            </svg>
          </div>
          )
        }
        {tokenOptions2 && (
          <div className='trade__to'>
            {tokenOptions2.map((index) => (
              <img
                className={`image__option ${askToken === index ? 'image__selected' : ''}`}
                src={`/src/image-data/void-elementals/${index}.jpg`}
                alt={`${index}`}
                width={200}
                height={200}
                onClick={() => handleAskTokenChange(index)}
                key={`${index}-2`}
              />
            ))}
          </div>     
        )}
      </div>
      <button className='action__button' onClick={handleClick} disabled={!currentAccount}>
        {loading ? hourglass : buttonText}
      </button>
    </div>
  )
}

export default ActionGroup