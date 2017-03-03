module.exports = function(middleware) {
	var	Middleware = {},
		onesignal = require('./library');

	Middleware.hasConfig = function(req, res, next) {
		if (onesignal.config && onesignal.config.id && onesignal.config.secret) next();
		else res.status(404);
	};

	Middleware.hasCode = function(req, res, next) {
		if (req.query && req.query.code) {
			next();
		} else if (req.query.hasOwnProperty('error') && req.query.error === 'access_denied') {
			res.redirect('onesignal/settings');
		} else {
			middleware.buildHeader(req, res, function() {
				res.render('500', {
					message: req.query.error
				});
			});
		}
	};

	Middleware.isLoggedIn = function(req, res, next) {
		if (req.user && parseInt(req.user.uid, 10) > 0)
			next();
		else
			res.redirect(403);
	};

	Middleware.setupRequired = function(req, res, next) {
		if (!req.user) {
			res.locals.setupRequired = false;
			return next();
		}
		onesignal.isUserAssociated(req.user.uid, function(err, assoc) {
			if (err) {
				return next(err);
			}
			res.locals.setupRequired = !assoc;
			next();
		});
	};

    Middleware.addDevice = function(req, res, next) {
    	if(!req.body || !req.body.player_id || !req.user ){
			return res.status(400).json('Invalid request');
		}

		onesignal.savePlayerId(req.user.uid, req.body.player_id,  function(err){
			if(err){
				return res.status(400).json(err);
			}
            next();
		});

    };

	return Middleware;
};
