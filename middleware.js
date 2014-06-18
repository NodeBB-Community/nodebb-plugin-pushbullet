var	Middleware = {},
	Pushbullet = require('./library');

Middleware.hasConfig = function(req, res, next) {
	if (Pushbullet.config && Pushbullet.config.id && Pushbullet.config.secret) next();
	else res.redirect('404');
};

Middleware.hasCode = function(req, res, next) {
	if (req.query && req.query.code) next();
	else res.redirect('404');
};

Middleware.isLoggedIn = function(req, res, next) {
	if (req.user && parseInt(req.user.uid, 10) > 0) next();
	else res.redirect('403');
};

Middleware.setupRequired = function(req, res, next) {
	Pushbullet.isUserAssociated(req.user.uid, function(err, assoc) {
		res.locals.setupRequired = !assoc;
		next();
	});
};

module.exports = Middleware;