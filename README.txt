Hello!

I'm Amr Nosir, and I'm working on the Stock Trading Platform by myself.

As of right now, the launch instructions for the server are:
* node server.js

NOTE: This only serves the navigable static pages, the business logic is not implemented yet

There are no initialization scripts yet, example data is hardcoded to show how the pages are expected to appear.

List of files:
* Main.html					Greeting Page, with two links, one to user, the other to stocks
* AccountOverview.html		Shows cash balance and an overview of the user's portfolio. Also displays an additional bar for user related pages
* AccountPortfolio.html		A searchable view  of all the stocks the user owns shares for
* AccountOrders.html		A searchable view of all the orders the user has which are still unfulfilled
* AccountWatchlists.html	Displays and allows management of all user created watchlists
* WatchlistX.html			A view of what a watchlist would look like, WatchlistG is identical, both are to be replaced by a template later
* AccountEvents.html		Lists event notifications, and events subscribed to by the user
* AccountHistory.html		A searchable view of the user's transaction history
* Stocks.html				A searchable list of all the available stocks
* GiggleStock.html			An example of how a stock's page would look like once a template is created
* Server.js					The JS file to launch the server