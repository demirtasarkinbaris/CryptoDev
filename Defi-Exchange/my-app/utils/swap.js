import { ethers } from "ethers";
import {
	EXCHANGE_CONTRACT_ABI,
	EXCHANGE_CONTRACT_ADDRESS,
	TOKEN_CONTRACT_ABI,
	TOKEN_CONTRACT_ADDRESS,
} from "../constants";

const fetchContractEXC = (signerOrProvider) => {
	const contract = new ethers.Contract(
		EXCHANGE_CONTRACT_ADDRESS,
		EXCHANGE_CONTRACT_ABI,
		signerOrProvider
	);
	return contract;
};

const fetchContractTOKEN = (signerOrProvider) => {
	const contract = new ethers.Contract(
		TOKEN_CONTRACT_ADDRESS,
		TOKEN_CONTRACT_ABI,
		signerOrProvider
	);
	return contract;
};

export const getAmountOfTokensReceivedFromSwap = async (
	_swapAmountWei,
	provider,
	ethSelected,
	ethBalance,
	reservedCD
) => {
	// Create a new instance of the exchange contract
	const exchangeContract = fetchContractEXC(provider);
	let amountOfTokens;
	// If `Eth` is selected this means our input value is `Eth` which means our input amount would be
	// `_swapAmountWei`, the input reserve would be the `ethBalance` of the contract and output reserve
	// would be the `Crypto Dev` token reserve
	if (ethSelected) {
		amountOfTokens = await exchangeContract.getAmountOfTokens(
			_swapAmountWei,
			ethBalance,
			reservedCD
		);
	} else {
		// If `Eth` is not selected this means our input value is `Crypto Dev` tokens which means our input amount would be
		// `_swapAmountWei`, the input reserve would be the `Crypto Dev` token reserve of the contract and output reserve
		// would be the `ethBalance`
		amountOfTokens = await exchangeContract.getAmountOfTokens(
			_swapAmountWei,
			reservedCD,
			ethBalance
		);
	}

	return amountOfTokens;
};

export const swapTokens = async (
	signer,
	swapAmountWei,
	tokenToBeReceivedAfterSwap,
	ethSelected
) => {
	// Create a new instance of the exchange contract
	const exchangeContract = fetchContractEXC(signer);
	const tokenContract = fetchContractTOKEN(signer);
	let tx;
	// If Eth is selected call the `ethToCryptoDevToken` function else
	// call the `cryptoDevTokenToEth` function from the contract
	// As you can see you need to pass the `swapAmount` as a value to the function because
	// it is the ether we are paying to the contract, instead of a value we are passing to the function
	if (ethSelected) {
		tx = await exchangeContract.ethToCryptoDevToken(
			tokenToBeReceivedAfterSwap,
			{
				value: swapAmountWei,
			}
		);
	} else {
		// User has to approve `swapAmountWei` for the contract because `Crypto Dev` token
		// is an ERC20
		tx = await tokenContract.approve(
			EXCHANGE_CONTRACT_ADDRESS,
			swapAmountWei.toString()
		);
		await tx.wait();
		// call cryptoDevTokenToEth function which would take in `swapAmountWei` of `Crypto Dev` tokens and would
		// send back `tokenToBeReceivedAfterSwap` amount of `Eth` to the user
		tx = await exchangeContract.cryptoDevTokenToEth(
			swapAmountWei,
			tokenToBeReceivedAfterSwap
		);
	}
	await tx.wait();
};
