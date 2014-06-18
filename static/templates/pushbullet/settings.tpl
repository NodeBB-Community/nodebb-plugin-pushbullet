<div class="row pushbullet authSuccess">
	<div class="panel panel-success">
		<div class="panel-body">
			<img class="pull-right" src="//www.pushbullet.com/img/header-logo.png" />
			<h1>Pushbullet Settings</h1>
			<p>
				Customise your Pushbullet integration with <strong>{site_title}</strong> here.
			</p>
			<form role="form" class="form pushbullet-settings">
				<div class="checkbox">
					<label for="pushbullet:enabled">
						<input id="pushbullet:enabled" name="pushbullet:enabled" type="checkbox" /> Enable Pushbullet Notifications
					</label>
				</div>
				<button type="button" class="btn btn-primary" id="save">Save Settings</button>
			</form>
		</div>
	</div>
</div>

<script>
	socket.emit('plugins.pushbullet.settings.load', function(err, settings) {
		var	defaults = {
				'pushbullet:enabled': '1'
			};

		for(key in settings) {
			if (settings.hasOwnProperty(key)) {
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
			app.alertSuccess('[[user:profile_update_success]]');
		});
	});
</script>