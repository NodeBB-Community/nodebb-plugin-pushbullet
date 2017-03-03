# onesignal Notifications

Allows NodeBB to interface with the onesignal service in order to provide push notifications to user mobile phones.

## Installation

    npm install nodebb-plugin-onesignal

## Configuration

1. Install and activate this plugin.
1. [Register an application via the onesignal website](https://www.onesignal.com/create-client), and obtain a client key and secret.
    * In particular, the `redirect_uri` should be your forum's URL with `/onesignal/auth` appended to it (e.g. `https://community.nodebb.org/onesignal/auth`)
1. Enter the client key and secret into the plugin's setup page (`/admin/onesignal`), and save.
1. Reload NodeBB.

## Screenshots

![NodeBB Notifications in onesignal](screenshots/onesignal-1.png)
![Push notifications on mobile phone](screenshots/onesignal-2.png)
![Admin panel setup](screenshots/onesignal-3.png)
![User Settings](screenshots/onesignal-5.png)
![Association Page](screenshots/onesignal-6.png)
![Profile Menu Item](screenshots/onesignal-7.png)
