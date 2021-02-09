const express = require('express');
let router = express.Router();

// """Database"""
const db = require('./database');

// For unique Ids
const { v4: uuidv4 } = require('uuid');

/****************
GET page requests
******************/
router.get("/Overview", (req, res) => {
    let user = getUser(req);
    res.render("views/AccountOverview.pug", { user, status: req.session });
});

router.get("/ViewPortfolio", (req, res) => {
    res.render("views/AccountPortfolio.pug", { status: req.session });
});

router.get("/ViewOrders", (req, res) => {
    res.render("views/AccountOrders.pug", { status: req.session });
});

router.get("/ViewWatchlists", (req, res) => {
    res.render("views/AccountWatchlists.pug", { status: req.session });
});

router.get("/ViewWatchlist/:watchlistName/", (req, res) => {
    let user = getUser(req);
    let watchlist = user.watchlists[req.params.watchlistName];
    res.render("views/Watchlist.pug", { watchlist, status: req.session });
});

router.get("/Events", (req, res) => {
    res.render("views/AccountEvents.pug", { status: req.session });
});

router.get("/ViewHistory", (req, res) => {
    res.render("views/AccountHistory.pug", { status: req.session });
});

/****************
POST requests
******************/
router.post("/Balance", (req, res) => {
    let amount = req.query.amount;
    let user = getUser(req);

    if (user) {
        if (isNaN(amount)) {
            res.status(406).send("Amount is not a number.");
        } else {
            user.cashBalance = user.cashBalance + Number(amount);
            res.set('Content-Type', 'text/plain');
            res.status(200).send("" + user.cashBalance);
        }
    } else {
        res.set('Content-Type', 'text/plain');
        res.status(404).send("User Not Found.");
    }
});

/****************
GET data requests
******************/
// Get a user's outstanding orders and limit response based on entryCount
router.get("/Orders", (req, res) => {
    let entryCount = req.query.count;
    let user = getUser(req);

    if (user) {
        if (isNaN(entryCount)) {
            res.status(406).send("Entry count is not a number.");
        } else {
            // Get orders
            let userOrders = findOrdersByUser(user);
            // Sort orders based on value of unfulfilled orders
            userOrders.sort((a, b) => -((a.numUnfulfilled * a.price) - (b.numUnfulfilled * b.price)));
            // Only need first entryCount orders
            // So delete orders from index entryCount onwards
            // If entryCount is 0 return all orders by user
            entryCount = Number(entryCount);
            if (entryCount != 0) {
                userOrders.splice(entryCount);
            }
            // Send the userOrders as JSON
            res.status(200).json(userOrders);
        }
    } else {
        res.set('Content-Type', 'text/plain');
        res.status(404).send("User Not Found.");
    }
});

// Get a user's portfolio and limit response based on entryCount
router.get("/Portfolio", (req, res) => {
    let entryCount = req.query.count;
    let user = getUser(req);

    if (user) {
        if (isNaN(entryCount)) {
            res.status(406).send("Entry count is not a number.");
        } else {
            // Get portfolio
            let userPortfolio = buildUserPortfolio(user);
            // Sort stocks based on total value owned by user
            userPortfolio.sort((a, b) => -(a.totalValue - b.totalValue));
            // Only need first entryCount stocks
            // So delete stocks from index entryCount onwards
            // If entryCount is 0 return all stocks by user
            entryCount = Number(entryCount);
            if (entryCount != 0) {
                userPortfolio.splice(entryCount);
            }
            // Send the userPortfolio as JSON
            res.status(200).json(userPortfolio);
        }
    } else {
        res.set('Content-Type', 'text/plain');
        res.status(404).send("User Not Found.");
    }
});

// Get specified watchlist data
router.get("/Watchlists/:watchlistName", (req, res) => {
    let user = getUser(req);
    if (user) {
        let watchlist = user.watchlists[req.params.watchlistName];
        let watchlistStocks = buildWatchlistPortfolio(user, watchlist);
        res.status(200).json(watchlistStocks);
    } else {
        res.set('Content-Type', 'text/plain');
        res.status(404).send("User Not Found.");
    }
});

// Get overview of all user's watchlists
router.get("/Watchlists", (req, res) => {
    let user = getUser(req);
    if (user) {
        res.status(200).json(user.watchlists);
    } else {
        res.set('Content-Type', 'text/plain');
        res.status(404).send("User Not Found.");
    }
});

// Get all user's notifications
router.get("/Notifications", (req, res) => {
    let user = getUser(req);
    if (user) {
        let notifications = findNotificationsByUser(user);
        res.status(200).json(notifications);
    } else {
        res.set('Content-Type', 'text/plain');
        res.status(404).send("User Not Found.");
    }
});

// Get all user's subscriptions
router.get("/Subscriptions", (req, res) => {
    let user = getUser(req);
    if (user) {
        let subscriptions = findSubscriptionsByUser(user);
        res.status(200).json(subscriptions);
    } else {
        res.set('Content-Type', 'text/plain');
        res.status(404).send("User Not Found.");
    }
});

// Get all the user's history
router.get("/History", (req, res) => {
    let user = getUser(req);
    if (user) {
        res.status(200).json(user.History);
    } else {
        res.set('Content-Type', 'text/plain');
        res.status(404).send("User Not Found.");
    }
});

/****************
Helper functions
******************/
function getUser(req) {
    return db.users.find((user) => user.userId === req.session.userId);
}

function findOrdersByUser(user) {
    let userOrders = [];

    for (let i = 0; i < user.orderIds.length; i++) {
        if (db.orders[user.orderIds[i]]) {
            userOrders.push(db.orders[user.orderIds[i]]);
        }
    }

    return userOrders;
}

function findNotificationsByUser(user) {
    let userNotifications = [];

    for (let i = 0; i < user.notificationIds.length; i++) {
        if (db.notifications[user.notificationIds[i]]) {
            userNotifications.push(db.notifications[user.notificationIds[i]]);
        }
    }

    return userNotifications;
}

function findSubscriptionsByUser(user) {
    let userSubscriptions = [];

    for (let i = 0; i < user.subscriptionIds.length; i++) {
        if (db.subscriptions[user.subscriptionIds[i]]) {
            userSubscriptions.push(db.subscriptions[user.subscriptionIds[i]]);
        }
    }

    return userSubscriptions;
}

function buildUserPortfolio(user) {
    let userPortfolio = [];

    // Use symbol to get appropriate stock data
    // properties needed from stock are: symbol, name, currentPrice
    for (symbol in user.portfolio) {
        if (db.stocks[symbol]) {
            let stock = db.stocks[symbol];
            let userStock = {
                "symbol": stock.symbol,
                "name": stock.name,
                "sharesOwned": user.portfolio[symbol].sharesOwned,
                "avgPaid": user.portfolio[symbol].avgPaid,
                "currentPrice": stock.currentPrice,
            };
            userStock.totalValue = userStock.currentPrice * userStock.sharesOwned;

            userPortfolio.push(userStock);
        }
    }

    return userPortfolio;
}

function buildWatchlistPortfolio(user, watchlist) {
    let watchlistPortfolio = [];

    for (let i = 0; i < watchlist.symbols.length; i++) {
        let symbol = watchlist.symbols[i];
        if (db.stocks[symbol]) {
            let stock = db.stocks[symbol];
            let watchlistStock = {
                "symbol": stock.symbol,
                "name": stock.name,
                "currentPrice": stock.currentPrice,
            };

            // If the watch list contains a symbol that is not owned, add some 0 values
            if (user.portfolio[symbol]) {
                watchlistStock.sharesOwned = user.portfolio[symbol].sharesOwned;
                watchlistStock.avgPaid = user.portfolio[symbol].avgPaid;
            } else {
                watchlistStock.sharesOwned = 0;
                watchlistStock.avgPaid = 0;
            }
            watchlistStock.totalValue = watchlistStock.currentPrice * watchlistStock.sharesOwned;

            watchlistPortfolio.push(watchlistStock);
        }
    }

    return watchlistPortfolio;
}

module.exports = router;