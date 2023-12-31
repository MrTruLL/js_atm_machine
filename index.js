/* 
ATM machine server 
Course : Beyond the Basics of JavaScript
TDL Homework : Svitlana Makarova
*/

// TODO: 1. Install/Import the necessary packages and start up a server

import express from 'express'
import fetch from 'node-fetch' 
import { z } from 'zod'
import bodyParser from 'body-parser'

const atm = express()
atm.use(bodyParser.json()) //middleware

const DEBUG = false //adding debug parameter to console output

const port = 3000 // The port our server will listen to
const atm_db_complete = {"1": 0, "5": 0, "10": 0, "20": 0, "50": 0, "100": 0, "500": 0, "1000": 0, "total" : 0};
const atm_db_min = {"1": 0, "total" : 0};
let atm_db = {};
	
//server start up
atm.listen(port, () => {
	console.log('ATM Server is listening at http://localhost:' + port)
})

// TODO: 2. Implement ATM initialization => `/`
atm.post('/', async (req, res) => {
	const { body } = req
	//create schema of the object
	const initSchema = z.object({ 
		banknotes: z.array(z.number()).nullable().optional()
	}).strict()
	
	const result = initSchema.safeParse(body)
	
	if(!result.success) {
		res.status(400).json({ error: 'Invalid request body!'})
		return
	}
	
	//initialization atm_db with allowed distinct banknotes
	let allowedList = {}
	if (body.banknotes == null) {allowedList = {}} 
	else if (body.banknotes.length === 0) {allowedList = atm_db_complete} 
	else {
		//remove duplicates using Set
		const allowedArr = [... new Set(body.banknotes)]
		
		//validate unmatched incoming banknotes
		for (let i = 0; i < allowedArr.length; i++) {
			let banknoteMatch = false;
			for (let atm_key in atm_db_complete) {
				if (allowedArr[i] == atm_key) {banknoteMatch = true}
			}
			if (!banknoteMatch) {
				const unmatchedBanknote = body.banknotes[i]
				res.status(400).json({ error: 'Invalid banknotes found:', unmatchedBanknote})	
				return
			}
		}
		//finalize list of allowed banknotes to initialize ATM
		for (const entry of allowedArr) {allowedList[entry] = 0}
	}
	
	//concatenate arrays
	atm_db = {...allowedList, ...atm_db_min}
	DEBUG && console.log("Initialized Atm_DB: ", atm_db)
	res.status(201).json({message: 'ATM is up and running!'})
	return
})

// TODO: 3. Implement ATM deposit => `/deposit`
atm.post('/deposit', (req, res) => {
	const { body } = req
	//create schema of the object to validate dataType
	const initSchema = z.object({ 
		amount: z.number()
	}).strict()
	
	const result = initSchema.safeParse(body)
	
	if(!result.success) {
		res.status(400).json({ error: 'Invalid request body!'})
		return
	} else if (Object.keys(atm_db).length === 0) { //check if atm_db was initialized before
		res.status(400).json({ error: 'Cannot make transaction. ATM is not initialized!'})
		return
	}
	
	// read atm_db to increase relevant available banknotes amount
	// clone atm_db to reduce it with "total"
	let atm_calculations = JSON.parse(JSON.stringify(atm_db))
	delete atm_calculations["total"]
	
	//reverse atm_db keys array to start comparing (compare deposited banknotes to DB banknotes) from biggest numbers
	const atm_calculations_array = Object.keys(atm_calculations).reverse()
	
	//deposit banknotes, in the "most efficient way possible". (compare deposited banknotes to DB banknotes and add relevant amount deposited)
	DEBUG && console.log("== Deposit process ==")
	let depositAmount = body.amount
	let transaction = {}
	atm_calculations_array.forEach((element) => {
		DEBUG && console.log("Trying to split deposit (" + depositAmount + ") by " + element)
		const depositBanknote = Math.floor(depositAmount / element)
		DEBUG && console.log("Division result: " + depositBanknote)
		
		// add to atm_db[atm_key] if not 0
		if (depositBanknote != 0) {
			// charge atm_db
			atm_db[element] += depositBanknote
			// decrease amount to calculate on banknotesNumber
			depositAmount = depositAmount - (depositBanknote * element)
			
			DEBUG && console.log("Transaction JSON forming: Element(key) = " + element + ", depositBanknote(value) = " + depositBanknote)
			
			transaction[element] = depositBanknote
			
			DEBUG && console.log("Amount left: ", depositAmount)
			DEBUG && console.log("transaction - ", transaction)
		}
	})
		
	//update Total amount for atm_db.total
	let total = 0;
	let atm_total_calculations = JSON.parse(JSON.stringify(atm_db))
	delete atm_total_calculations["total"]
	
	DEBUG && console.log("== Calculating total ==")
	DEBUG && console.log("atm_calculations:", atm_total_calculations)
	for (let atm_key in atm_total_calculations) {
		DEBUG && console.log("atm_key:", Number(atm_key))
		DEBUG && console.log("atm_total_calculations[atm_key]:", atm_total_calculations[atm_key])
		total += (Number(atm_key) * atm_total_calculations[atm_key])
	}
	atm_db["total"] = total
	
	//add json transaction Response with total deposited amount
	transaction["total"] = body.amount
	
	res.status(200).json({message: `Successful DEPOSIT of ${body.amount} UAH hryvnas!`, transaction})
	return
});

// TODO: 4. Implement ATM withdraw => `/withdraw`
atm.get('/withdraw', async (req, res) => {
	const { query } = req
	DEBUG && console.log("Withdraw query", query)
	
	if (Object.keys(atm_db).length === 0) { //check if initiated
		res.status(400).json({ error: 'Cannot make transaction. ATM is not initialized!'})
		return
	}
	
	// clone atm_db to reduce it with "total"
	let atm_availableBanknotes = JSON.parse(JSON.stringify(atm_db))
	delete atm_availableBanknotes["total"]
	let withdrawAmount = query.amount
	
	//reverse atm_db keys array to start comparing (compare deposited banknotes to DB banknotes) from biggest numbers
	const atm_availableBanknotes_array = Object.keys(atm_availableBanknotes).reverse()
	
	//check if ATM have enough money
	if (atm_db["total"] < withdrawAmount) {
		DEBUG && console.log("Withdraw attempt: " + "Not enough money in the ATM!")
		res.status(503).json({ error: "Not enough money in the ATM!"})
		return
	}
	
	//withdraw banknotes, in the "most efficient way possible". (compare withdrawal banknotes to DB banknotes and add relevant amount deposited)
	DEBUG && console.log("== Withdraw process ==")
	let transaction = {}
	atm_availableBanknotes_array.forEach((element) => {
		DEBUG && console.log("Trying to split withdraw (" + withdrawAmount + ") by " + element)
		const withdrawBanknote = Math.floor(withdrawAmount / element)
		DEBUG && console.log("Division result: " + withdrawBanknote)
		
		// remove from atm_db[atm_key] if not 0 AND enough money for specific banknote
		if (withdrawBanknote != 0 && (atm_db[element] >= (withdrawBanknote * element))) {
			// decrease atm_db
			DEBUG && console.log("Element " + element + " was - ", atm_db[element])
			atm_db[element] -= withdrawBanknote
			DEBUG && console.log("Element " + element + " become - ", atm_db[element])
			// decrease amount to calculate on banknotesNumber
			withdrawAmount = withdrawAmount - (withdrawBanknote * element)
	
			DEBUG && console.log("Transaction JSON forming: Element(key) = " + element + ", withdrawBanknote(value) = " + withdrawBanknote)
			
			transaction[element] = withdrawBanknote
			
			DEBUG && console.log("Amount left: ", withdrawAmount)
			DEBUG && console.log("transaction - ", transaction)
		}
	})
	
	//if withdrawAmount still wasn't withdrawn at all - error
	if (withdrawAmount = query.amount) {
		res.status(400).json({ error: "Not enough banknotes to complete the transaction!"})
		return
	}
	
	//update Total amount for atm_db.total
	let total = 0;
	let atm_total_calculations = JSON.parse(JSON.stringify(atm_db))
	delete atm_total_calculations["total"]
	
	DEBUG && console.log("== Calculating total ==")
	DEBUG && console.log("atm_calculations:", atm_total_calculations)
	for (let atm_key in atm_total_calculations) {
		DEBUG && console.log("atm_key:", Number(atm_key))
		DEBUG && console.log("atm_total_calculations[atm_key]:", atm_total_calculations[atm_key])
		total += (Number(atm_key) * atm_total_calculations[atm_key])
	}
	atm_db["total"] = total
	
	//add json transaction Response with total deposited amount
	transaction["total"] = query.amount
	
	res.status(200).json({message: `Successful WITHDRAW of ${query.amount} UAH hryvnas!`, transaction})
	return
})

// TODO: BONUS - Implement ATM balance check => `/balance`
atm.get('/balance', (req, res) => {
	
	if (Object.keys(atm_db).length === 0) { //check if initiated
		res.status(400).json({ error: 'Cannot make transaction. ATM is not initialized!'})
		return
	}
	
	DEBUG && console.log("ATM balance IF request: ", atm_db["total"])
	res.status(200).json({message: 'Balance request', balance: atm_db.total})
	return
})

// atm.get('/', (req, res) => {
	// res.json({message: 'Hello World!'})
	// DEBUG && console.log("Current ATM: ", atm_db)
// })