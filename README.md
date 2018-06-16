# This plugin is in maintenance mode

As Pushbullet's free tier is no longer able to be used by power users, and as the various apps don't seem to be updated as frequently, we've stopped actively developing this plugin for the time being.

# Pushbullet Notifications

Allows NodeBB to interface with the Pushbullet service in order to provide push notifications to user mobile phones.

## Installation

    npm install nodebb-plugin-pushbullet

## Configuration

1. Install and activate this plugin.
1. [Register an application via the Pushbullet website](https://www.pushbullet.com/create-client), and obtain a client key and secret.
    * In particular, the `redirect_uri` should be your forum's URL with `/pushbullet/auth` appended to it (e.g. `https://community.nodebb.org/pushbullet/auth`)
1. Enter the client key and secret into the plugin's setup page (`/admin/plugins/pushbullet`), and save.
1. Reload NodeBB.

## Screenshots

![NodeBB Notifications in Pushbullet](screenshots/pushbullet-1.png)
![Push notifications on mobile phone](screenshots/pushbullet-2.png)
![Admin panel setup](screenshots/pushbullet-3.png)
![User Settings](screenshots/pushbullet-5.png)
![Association Page](screenshots/pushbullet-6.png)
![Profile Menu Item](screenshots/pushbullet-7.png)
