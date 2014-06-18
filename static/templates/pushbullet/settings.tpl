<div class="row pushbullet settings">
	<!-- IF !setupRequired -->
	<div class="panel panel-success">
		<div class="panel-body">
			<img class="pull-right" src="//www.pushbullet.com/img/header-logo.png" />
			<h1>Pushbullet Notification Settings</h1>
			<p class="lead">
				Customise your Pushbullet integration with <strong>{site_title}</strong> here.
			</p>

			<h2>General Settings</h2>
			<form role="form" class="form pushbullet-settings">
				<div class="checkbox">
					<label for="pushbullet:enabled">
						<input id="pushbullet:enabled" name="pushbullet:enabled" type="checkbox" /> Enable Pushbullet Notifications
					</label>
				</div>
				<button type="button" class="btn btn-primary" id="save">Save Settings</button>
			</form>

			<h2>Disassociate</h2>
			<button type="button" class="btn btn-warning" id="disassociate">Disassociate with Pushbullet</button>
			<p>
				By disassociating with Pushbullet, your account will no longer be tied to your Pushbullet account.
			</p>
		</div>
	</div>
	<!-- ELSE -->
	<div class="panel panel-default">
		<div class="panel-body text-center">
			<img src="//www.pushbullet.com/img/header-logo.png" />
			<p class="lead">
				This account is not currently associated with a Pushbullet account.
			</p>

			<p>
				<a class="btn btn-lg btn-primary" href="{relative_path}/pushbullet/setup">Associate account with Pushbullet</a>
			</p>

			<a href="https://play.google.com/store/apps/details?id=com.pushbullet.android">
				<img src="//pushbullet.com/img/googleplay.png" height="60px">
			</a>
			<a href="https://itunes.apple.com/us/app/pushbullet/id810352052">
				<img src="//pushbullet.com/img/apple-store.png" height="60px">
			</a>
		</div>
	</div>
	<!-- ENDIF !setupRequired -->
</div>