# js_atm_machine
JS Express server based ATM machine realization for JS_Intermediate course

##### Oleh Ivashchenko
---
### Introduction

This is the Final task required to complete the course on Intermediate level JavaScript. \
When implementing the task, try to use the **latest ES6 features** we talked about throughout the course. Try to make your code clean and easy to read. Also, try to **avoid duplication of code** as much as you can.

---

### ATM Machine with API endpoints

This application represents a simplified version of an ATM. You need to build an [Express](https://expressjs.com/) server that listens to various endpoints, to mimic the behavior of an ATM. \
To start off, the ATM machine is empty. The user needs to **initialize** it first, after which they can either **deposit** or **withdraw** money to/from it.

#### ATM data model

The ATM will be represented by an object with the following properties:
- `total` - representing the total amount of 'currency' currently stored in the ATM
- dynamic keys representing the banknotes that the ATM can support

##### Banknotes that CAN be supported: 1, 5, 10, 20, 100, 500, 1000

> **Important**: The `1` banknote should ALWAYS be supported

The user initializes the ATM at the beginning of the app, **providing the supported banknotes** - they can either choose to **support some of the banknotes**, or **support all of the banknotes** provided above.

#### Initializing the ATM

At the beginning of the app, the ATM object is not initialized. \
To initialize the ATM, the user must send a `POST request` to the ATM API endpoint `/` with the body

```json
{ 
    "banknotes": number[] | null
}
```

Notice the `banknotes` field can be `null` - **the user can pass in `null` or an empty array** for the ATM to support all the default banknotes. \
Alternatively, they can pass in an array of numbers, containing a subset of the supported banknotes.

###### Example

```json
{
    "banknotes": [10, 100, 1000]
}
```
If the user chooses the above configuration - the ATM object (initially) would look like this:

```js
    const ATM = {
        1: 0, // The '1' banknote is here because it should ALWAYS be supported
        10: 0,
        100: 0,
        1000: 0,
        total: 0
    };
```

> **Note**: Is a regular object the best approach for representing the ATM? Is there maybe another data structure better fit to handle this type of data?

&nbsp;

> **Important**: If the list of banknotes provided by the user, contains a banknote that isn't supported - the entire list is considered invalid and an `error` should be returned.

```json
{
    "error": "Invalid list of banknotes!"
}
```

If the initialization is a success, the API returns a success message:

###### Example

```json
{
    "message": "ATM is up and running!"
}
```

&nbsp;


> **Important**: If the user makes a request to **deposit** or **withdraw** money, and the ATM hasn't been initialized, an `error` should be returned.

```json
{
    "error": "Cannot make transaction. ATM is not initialized!"
}
```
---

#### Deposit

To deposit money into the ATM, the user can send a `POST request` to the ATM API endpoint `/deposit` with the body

```json
{
    "amount": number
}
```

#### Withdraw

To withdraw money, the user can send a `GET request` to the ATM API endpoint `/withdraw` with the query parameter `amount={number}`

---

### Task

Your task is to program the ATM to deposit and withdraw banknotes, **in the most efficient way possible**. \
What this means is that both when **depositing** (inserting) and **withdrawing** (returning) money - the ATM should do that using **the least amount of banknotes as possible** - with the banknotes that it supports.

###### Example

Let's say the ATM is empty and looks like this:

```js
const ATM = {
    1: 0, // Again, supported by default
    10: 0,
    20: 0,
    100: 0,
    total: 0
}
```

If we then choose to store **390 'currency'** into it, the most efficient way to do that would be to store it with:
- 3 x 100 banknotes => **300**
- 4 x 20 banknotes => **80**
- 1 x 10 banknote => **10**
- Total: **390**

So, after that operation the ATM should look like this:

```js
const ATM = {
    1: 0,
    10: 1,
    20: 4,
    100: 3,
    total: 390
}
```

If we then choose to take out **70 'currency'**, the most efficient way to do that would be to return them using:
- 3 x 20 banknotes => **60**
- 1 x 10 banknote => **10**
- Total: **70**

So after that operation the ATM should look like this:

```js
const ATM = {
    1: 0,
    10: 0,
    20: 1,
    100: 3,
    total: 320
}
```
---

#### What is your job?

Your job will be to figure out the algorithm to do this efficient deposit and withdraw operation. In addition, when a transaction is successful, you will need to return an **message** to the user, **saying that the transaction was successful** and **return some kind of text representation of what the transaction looked like**. \
Below are some examples of how that might look like.

> **Note**: You can use the provided examples are your template or choose your own way of representing the transaction

###### Example - Successfully *depositing* 390 'currency'

```json
{
    "message": "Successful DEPOSIT of 390 'currency'!",
    "transaction": {
        "100": 3, // Used 3 banknotes of 100 'currency'
        "20": 4, // Used 4 banknotes of 20 'currency'
        "10": 1, // Used 1 banknote of 10 'currency'

        "total": 390 // The total amount of money DEPOSITED
        // NOT the total amount of money in the ATM
    }
}
```
###### Example - Successfully *withdrawing* 70 'currency'

```json
{
    "message": "Successful WITHDRAWAL of 70 'currency'!",
    "transaction": {
        "20": 3, // Used 3 banknotes of 20 'currency'
        "10": 1, // Used 1 banknote of 10 'currency'

        "total": 70 // The total amount of money WITHDRAWN
        // NOT the total amount of money in the ATM
    }
}
```

#### Important components of the returned response

However you choose to structure your response for a successful transaction, you **must** include these 3 pieces of information inside of your response:
- The **type** of the transaction (deposit/withdraw)
- The **type and number of banknotes** used in the transaction
- The **total amount of money** deposited/withdrawn

Again, your response **doesn't need** to look like the ones above, it just needs to contain the above mentioned information in any shape you choose.

##### What if there isn't enough money in the ATM?

If there isn't enough money in the ATM, an `error` should be returned.

```json
{
    "error": "Not enough money in the ATM!"
}
```

##### What if there IS enough money but NOT ENOUGH banknotes?

In the case that there are not enough banknotes to complete a withdrawal, an error should be returned.

```json
{
    "error": "Not enough banknotes to complete the transaction!"
}
```

**Example:** \
The ATM only has 2 banknotes of 20 'currency' - this means it has a total of 40 'currency' \
The user asks for 30 'currency' \
In this case, while the total IS technically larger than the requested amount - the ATM doesn't have the APPROPRIATE BANKNOTES to perform this transaction (1x10 + 1x20), since it only has 2x20 banknotes \
This should then be considered an error with an response like the one above.

---

### Bonus Task

Add a feature for the user to **check the ATM's balance**. \
Create an endpoint `/balance` which the user can hit to check the state of the ATM.

What type of request should this be?

###### Example response

```json
{
    "balance": number // The total amount of money in the ATM
}
```

If the ATM has not been initialized, return an `error`

```json
{
    "error": "Cannot check balance. ATM is not initialized!"
}
```
