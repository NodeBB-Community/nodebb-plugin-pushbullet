module.exports = function(middleware) {
	var	Middleware = {},
		Pushbullet = require('./library');

	Middleware.hasConfig = function(req, res, next) {
		if (Pushbullet.config && Pushbullet.config.id && Pushbullet.config.secret) next();
		else res.redirect('404');
	};

	Middleware.hasCode = function(req, res, next) {
		if (req.query && req.query.code) {
			next();
		} else if (req.query.hasOwnProperty('error') && req.query.error === 'access_denied') {
			res.redirect('pushbullet/settings');
		} else {
			middleware.buildHeader(req, res, function() {
				res.render('500', {
					message: req.query.error
				});
			});
		}
	};

	Middleware.isLoggedIn = function(req, res, next) {
		if (req.user && parseInt(req.user.uid, 10) > 0) next();
		else res.redirect('403');
	};

	Middleware.setupRequired = function(req, res, next) {
		if (!req.user) {
			res.locals.setupRequired = false;
			return next();
		}
		Pushbullet.isUserAssociated(req.user.uid, function(err, assoc) {
			if (err) {
				return next(err);
			}
			res.locals.setupRequired = !assoc;
			next();
		});
	};

	return Middleware;
};
