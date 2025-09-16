import React, { useEffect, useMemo, useState, useRef } from 'react'
import { forgeAddress, forgeABI, voidElementalsAddress, voidElementalsABI } from '../utils/constants'
import { ethers, InterfaceAbi } from 'ethers'
import { enqueueSnackbar } from 'notistack'
import Web3Modal from 'web3modal'

type MintableToken = 0 | 1 | 2
type ForgeableToken = 3 | 4 | 5 | 6
type TradeableToken = 0 | 1 | 2 | 3 | 4 | 5 | 6

interface ForgeContextType {
  currentAccount: string
  connectWallet: () => Promise<void>
  disconnectWallet: () => void
  mintToken: (selectedValue: MintableToken) => void
  forgeToken: (selectedValue: ForgeableToken) => void
  tradeToken: (selectedValue: TradeableToken, askToken: MintableToken) => void
  loading: boolean
  getBalances: (userAddress: string) => void
}

export const ForgeContext = React.createContext<ForgeContextType | undefined>(undefined)

export const ForgeProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentAccount, setCurrentAccount] = useState<string>('')
  const [web3Provider, setWeb3Provider] = useState<ethers.BrowserProvider | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [instance, setInstance] = useState<any>(null) 
  const [switchingNetwork, setSwitchingNetwork] = useState<boolean>(false)
  const checkingNetwork = useRef<boolean>(false) 

  const web3Modal = useMemo(
    () =>
      new Web3Modal({
        cacheProvider: true,
        providerOptions: {},
      }),
    []
  )

  const connectWallet = async () => {
    try {
      const instance = await web3Modal.connect()
      if (!instance) throw new Error('Failed to connect to the wallet.')

      setInstance(instance)
      const provider = new ethers.BrowserProvider(instance)

      setWeb3Provider(provider)

      const accounts = await provider.listAccounts()
      if (accounts.length) {
        setCurrentAccount(accounts[0].address)
      }

      await checkNetwork(provider)

      instance.on('chainChanged', handleChainChanged)
      instance.on('accountsChanged', handleAccountsChanged)
    } catch (error) {
      console.error('Failed to connect wallet', error)
      enqueueSnackbar('Failed to connect wallet. Please try again.', {
        variant: 'error',
        anchorOrigin: {
          vertical: 'top',
          horizontal: 'center',
        },
      })
    }
  }

  const handleChainChanged = async (chainId: string) => {
    if (web3Provider) {
      const newProvider = new ethers.BrowserProvider(window.ethereum)
      setWeb3Provider(newProvider)
      await checkNetwork(newProvider)
    }
  }

  const handleAccountsChanged = (accounts: string[]) => {
    if (accounts.length === 0) {
      disconnectWallet()
    } else {
      setCurrentAccount(accounts[0])
    }
  }

  const checkNetwork = async (provider: ethers.BrowserProvider) => {
    if (checkingNetwork.current) return
    checkingNetwork.current = true

    try {
      const network = await provider.getNetwork()
      const currentChainId = Number(network.chainId)

      if (currentChainId !== 11155111) {
        enqueueSnackbar('Please switch to the Sepolia network to use this application.', {
          variant: 'warning',
          anchorOrigin: {
            vertical: 'top',
            horizontal: 'center',
          },
        })
        await switchToSepolia()
      }
    } catch (error) {
      console.error('Failed to check network', error)
      enqueueSnackbar('Failed to check network. Please refresh and try again.', {
        variant: 'error',
        anchorOrigin: {
          vertical: 'top',
          horizontal: 'center',
        },
      })
    } finally {
      checkingNetwork.current = false
    }
  }

  const switchToSepolia = async (): Promise<void> => {
    if (switchingNetwork) return
    setSwitchingNetwork(true)

    if (window.ethereum) {
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0xaa36a7' }],
        })
        if (web3Provider) {
          await checkNetwork(web3Provider)
        }
      } catch (switchError: any) {
        if (switchError.code === 4902) {
          try {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [
                {
                  chainId: '0xaa36a7',
                  chainName: 'Sepolia Test Network',
                  rpcUrls: ['https://rpc.sepolia.org'],
                  nativeCurrency: {
                    name: 'SepoliaETH',
                    symbol: 'ETH',
                    decimals: 18,
                  },
                  blockExplorerUrls: ['https://sepolia.etherscan.io'],
                },
              ],
            })
          } catch (addError) {
            console.error('Failed to add Sepolia network', addError)
          }
        }
      } finally {
        setSwitchingNetwork(false)
      }
    } else {
      console.error('Ethereum object not found, please install MetaMask.')
      enqueueSnackbar('Ethereum object not found. Please install MetaMask.', {
        variant: 'error',
        anchorOrigin: {
          vertical: 'top',
          horizontal: 'center',
        },
      })
      setSwitchingNetwork(false)
    }
  }

  const disconnectWallet = async () => {
    try {
      if (instance) {
        instance.removeListener('chainChanged', handleChainChanged)
        instance.removeListener('accountsChanged', handleAccountsChanged)

        await web3Modal.clearCachedProvider()
        setInstance(null)
        setWeb3Provider(null)
        setCurrentAccount('')
      }
    } catch (error) {
      console.error('Failed to disconnect wallet', error)
      enqueueSnackbar('Failed to disconnect wallet. Please try again.', {
        variant: 'error',
        anchorOrigin: {
          vertical: 'top',
          horizontal: 'center',
        },
      })
    }
  }

  const getEthereumContract = async (contractAddress: string, contractABI: InterfaceAbi) => {
    if (!web3Provider) throw new Error('No Web3 Provider found')

    const signer = await web3Provider.getSigner()
    const contract = new ethers.Contract(contractAddress, contractABI, signer)

    return contract
  }

  const mintToken = async (selectedValue: MintableToken) => {
    const forgeContract = await getEthereumContract(forgeAddress, forgeABI)
    try {
      setLoading(true)
      const tx = await forgeContract.mintTokens(selectedValue)
      await tx.wait()
      enqueueSnackbar(`Token ID ${selectedValue} successfully minted!`, {
        variant: 'success',
        anchorOrigin: {
          vertical: 'top',
          horizontal: 'center',
        },
      })
    } catch (error: unknown) {
      let errorMessage = 'An unknown error occurred!'

      if (typeof error === 'object' && error !== null && 'info' in error) {
        const errorWithInfo = error as { info: { error?: { message?: string } } }
        errorMessage = errorWithInfo.info?.error?.message || errorMessage
      }

      enqueueSnackbar(errorMessage, {
        variant: 'error',
        anchorOrigin: {
          vertical: 'top',
          horizontal: 'center',
        },
      })
    } finally {
      setLoading(false)
    }
  }

  const forgeToken = async (selectedValue: ForgeableToken) => {
    const forgeContract = await getEthereumContract(forgeAddress, forgeABI)
    try {
      setLoading(true)
      const tx = await forgeContract.forge(selectedValue)
      await tx.wait()
      enqueueSnackbar(`Token ID ${selectedValue} successfully forged!`, {
        variant: 'success',
        anchorOrigin: {
          vertical: 'top',
          horizontal: 'center',
        },
      })
    } catch (error: unknown) {
      let errorMessage = 'An unknown error occurred!'

      if (typeof error === 'object' && error !== null && 'info' in error) {
        const errorWithInfo = error as { info: { error?: { message?: string } } }
        errorMessage = errorWithInfo.info?.error?.message || errorMessage
      }

      enqueueSnackbar(errorMessage, {
        variant: 'error',
        anchorOrigin: {
          vertical: 'top',
          horizontal: 'center',
        },
      })
    } finally {
      setLoading(false)
    }
  }

  const getBalances = async (userAddress: string) => {
    const voidElementalsContract = await getEthereumContract(voidElementalsAddress, voidElementalsABI)
    try {
      const balances = await voidElementalsContract.balanceOfBatch(
        Array(7).fill(userAddress),
        [0, 1, 2, 3, 4, 5, 6]
      )
      return balances
    } catch (error: unknown) {
      console.log(error)
    }
  }

  const tradeToken = async (selectedValue: TradeableToken, askToken: MintableToken) => {
    const forgeContract = await getEthereumContract(forgeAddress, forgeABI)
    try {
      setLoading(true)
      const tx = await forgeContract.trade(selectedValue, askToken)
      await tx.wait()
      enqueueSnackbar(`Token ID ${selectedValue} successfully traded for Token ID ${askToken}!`, {
        variant: 'success',
        anchorOrigin: {
          vertical: 'top',
          horizontal: 'center',
        },
      })
    } catch (error: unknown) {
      let errorMessage = 'An unknown error occurred!'

      if (typeof error === 'object' && error !== null && 'info' in error) {
        const errorWithInfo = error as { info: { error?: { message?: string } } }
        errorMessage = errorWithInfo.info?.error?.message || errorMessage
      }

      enqueueSnackbar(errorMessage, {
        variant: 'error',
        anchorOrigin: {
          vertical: 'top',
          horizontal: 'center',
        },
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const init = async () => {
      if (web3Modal.cachedProvider) {
        await connectWallet()
      }
    }

    init()

    return () => {
      if (instance) {
        instance.removeListener('chainChanged', handleChainChanged)
        instance.removeListener('accountsChanged', handleAccountsChanged)
      }
    }
  }, [instance])

  const value = {
    currentAccount,
    connectWallet,
    disconnectWallet,
    mintToken,
    forgeToken,
    tradeToken,
    loading,
    getBalances,
  }

  return <ForgeContext.Provider value={value}>{children}</ForgeContext.Provider>
}
