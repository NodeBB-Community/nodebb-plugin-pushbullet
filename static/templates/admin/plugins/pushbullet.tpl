<h1><i class="fa fa-mobile"></i> Pushbullet Notifications</h1>

<p>
	Allows NodeBB to interface with the Pushbullet service in order to provide push notifications to user mobile phones.
</p>

<h2>Installation</h2>

<ol>
	<li>Install and activate this plugin.</li>
	<li>
		<a href="https://www.pushbullet.com/create-client">Register an application via the Pushbullet website</a>, and obtain a client key and secret.<br />
		<em>In particular, the <code>redirect_uri</code> should be your forum's URL with <code>/pushbullet/auth</code> appended to it (e.g. <code>https://community.nodebb.org/pushbullet/auth</code>)</em>
	</li>
	<li>Enter the client key and secret into the plugin's setup page (<code>/admin/pushbullet</code>), and save.</li>
	<li>Restart your NodeBB.</li>
</ol>	

<h2>Configuration</h2>

<form class="form pushbullet-settings">
	<div class="form-group">
		<label for="id">Client ID</label>
		<input type="text" class="form-control" id="id" name="id" />
	</div>
	<div class="form-group">
		<label for="secret">Client Secret</label>
		<input type="text" class="form-control" id="secret" name="secret" />
	</div>
	<button type="button" class="btn btn-lg btn-primary" id="save">Save</button>
</form>

<script type="text/javascript">
	require(['settings'], function(Settings) {
		Settings.load('pushbullet', $('.pushbullet-settings'));

		$('#save').on('click', function() {
			Settings.save('pushbullet', $('.pushbullet-settings'), function() {
				app.alert({
					type: 'success',
					alert_id: 'pushbullet-saved',
					title: 'Restart Required',
					message: 'Please restart your NodeBB to complete configuration of the Pushbullet plugin',
					clickfn: function() {
						socket.emit('admin.restart');
					}
				})
			});
		});
	});
</script>