define('forum/pushbullet/settings', function() {
	var Settings = {};

	Settings.init = function() {
		socket.emit('plugins.pushbullet.settings.load', function(err, settings) {
			var	defaults = {
					'pushbullet:enabled': '1'
				};

			for(key in defaults) {
				if (defaults.hasOwnProperty(key)) {
					if (settings[key] === null) {
						settings[key] = defaults[key];
					}
				}
			}

			// Checkbox handling
			settings['pushbullet:enabled'] = settings['pushbullet:enabled'] === '1' ? 'on' : 'off';
			$('.pushbullet-settings').deserialize(settings);
		});

		$('#save').on('click', function() {
			var settings = $('.pushbullet-settings').serializeObject();

			// Checkbox handling
			settings['pushbullet:enabled'] = settings['pushbullet:enabled'] ? 1 : 0;

			socket.emit('plugins.pushbullet.settings.save', settings, function(err) {
				if (!err) {
					app.alertSuccess('[[user:profile_update_success]]');
				} else {
					app.alertError(err.message || '[[error:invalid-data]]');
				}
			});
		});

		$('#disassociate').on('click', Settings.disassociate);
	};

	Settings.disassociate = function() {
		socket.emit('plugins.pushbullet.disassociate', {}, function(err) {
			if (!err) {
				window.location.reload();
			} else {
				app.alertError(err.message || '[[error:invalid-data]]');
			}
		});
	};

	return Settings;
})