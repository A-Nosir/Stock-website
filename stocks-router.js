const express = require('express');
let router = express.Router();

// """Database"""
const db = require('./database');

// For unique Ids
const { v4: uuidv4 } = require('uuid');

/****************
GET page requests
******************/
router.get("/ViewAll", (req, res) => {
    res.render("views/Stocks.pug", { status: req.session });
});

router.get("/:symbol", (req, res) => {
    let stock = db.stocks[req.params.symbol];
    let user;
    let orders;
    if (stock) {
        if (req.session.loggedin) {
            user = db.users.find((user) => user.userId === req.session.userId);
            orders = findOrdersByStockAndUser(stock, user);
        }
        res.render("views/Stock", { stock, user, orders, status: req.session });
    } else {
        res.status(404).send("Stock Not Found.");
    }
});

/****************
POST requests
******************/
router.post("/:symbol/Buy", (req, res) => {
    let shares = req.query.shares;
    let price = req.query.price;
    let user = getUser(req);
    let stock = db.stocks[req.params.symbol];

    if (user && stock) {
        // Validate query values
        if (isNaN(shares) || isNaN(price)) {
            res.set('Content-Type', 'text/plain');
            res.status(406).send("One or both values are not numbers.");
        } else {
            // Check if user has enough cash to buy
            shares = Number(shares);
            price = Number(price);
            if (user.cashBalance >= shares * price) {
                // hold onto portion of user balance, 
                // if the order is cancelled return the money using unfulfilled shares
                // when order is fulfilled return the difference if any
                user.cashBalance -= (shares * price);

                orderId = uuidv4();
                let newOrder = {
                    "orderId": orderId,
                    "userId": user.userId,
                    "time": new Date(),
                    "symbol": stock.symbol,
                    "stockName": stock.name,
                    "type": "Buy",
                    "price": price,
                    "numUnfulfilled": shares,
                    "initialNum": shares
                };

                // Add the order everywhere it should be
                db.orders[orderId] = newOrder;
                stock.orders.push(orderId);
                user.orderIds.push(orderId);

                res.status(200).json(newOrder);
            } else {
                res.set('Content-Type', 'text/plain');
                res.status(406).send("Your balance is insufficient.");
            }
        }
    } else {
        res.set('Content-Type', 'text/plain');
        res.status(404).send("User/Stock Not Found.");
    }
});

router.post("/:symbol/Sell", (req, res) => {
    let shares = req.query.shares;
    let price = req.query.price;
    let user = getUser(req);
    let stock = db.stocks[req.params.symbol];

    if (user && stock) {
        // Validate query values
        if (isNaN(shares) || isNaN(price)) {
            res.set('Content-Type', 'text/plain');
            res.status(406).send("One or both values are not numbers.");
        } else {
            // Check if user has enough shares that are not already on sale to sell
            shares = Number(shares);
            price = Number(price);
            let investment = user.portfolio[stock.symbol];
            if (investment.sharesOwned >= (shares + investment.sharesOnSale)) {
                orderId = uuidv4();
                let newOrder = {
                    "orderId": orderId,
                    "userId": user.userId,
                    "time": new Date(),
                    "symbol": stock.symbol,
                    "stockName": stock.name,
                    "type": "Sell",
                    "price": price,
                    "numUnfulfilled": shares,
                    "initialNum": shares
                };
                investment.sharesOnSale += shares;
                console.log(user);
                // Add the order everywhere it should be
                db.orders[orderId] = newOrder;
                stock.orders.push(orderId);
                user.orderIds.push(orderId);

                res.status(200).json(newOrder);
            } else {
                res.set('Content-Type', 'text/plain');
                res.status(406).send("You don't have enough shares that are not on sale.");
            }
        }
    } else {
        res.set('Content-Type', 'text/plain');
        res.status(404).send("User/Stock Not Found.");
    }
});

/****************
GET data requests
******************/
router.get("/", (req, res) => {
    // Send all the stocks as JSON
    res.status(200).json(db.stocks);
});

// For the REST API
router.get("/:symbol", (req, res) => {
    // Send the needed stock as JSON
    let stock = [];
    if (db.stocks[req.params.symbol]) {
        stock.push(db.stocks[req.params.symbol]);
        res.status(200).json(stock);
    }
});

// Helper functions
function getUser(req) {
    return db.users.find((user) => user.userId === req.session.userId);
}

function findOrdersByStockAndUser(stock, user) {
    let orders = [];

    // find orders on the stock that were place by user
    for (let i = 0; i < stock.orders.length; i++) {
        let orderId = stock.orders[i];
        if (db.orders[orderId]) {
            let order = db.orders[orderId];
            if (order.userId == user.userId) {
                orders.push(order);
            }
        }
    }

    return orders;

}

module.exports = router;