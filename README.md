# Workplace Out of Office bot

A simple Out of Office bot for Workplace. Set your OOO by messaging the bot. OOO messages can be set for a fixed period of time or indefinately. If a user messages an OOO user, they will receive a reply with the OOO user's message. If an OOO user is tagged in a group post the bot will reply to the poster to let them know the user is away. The bot tracks who it has replied to so that it doesn't repeatedly contact the poster.

## Non-technical people - please read this

To enable this bot you will need a web and database host. You can get both of these with via a service like [Heroku](https://dashboard.heroku.com/apps) or [Zeit](https://zeit.co). If you're confused then [reach out to me](mailto:anthony@wearecoolr.com). Coolr offer a Workplace reseller package called **Coolr Direct**. [Coolr Direct](http://bit.ly/2L2FrSF) does not cost you a penny but we give you free operational and technical support, free flexible billing and a free onboarding bot. If you join Coolr Direct I'll be able to help you get this bot up and running in your instance. It's one of those things that sounds too good to be true, but it honestly is exactly what it says on the tin.

## Technical install

The bot runs on Node.js and uses [Sequelize](http://www.sequelizejs.com) as an ORM, meaning that you can use your prefered database. We use PostGreSQL.

You will need to add the following environment variables

    DATABASE_URL
    ORGANISATION_WP_DOMAIN
    WP_ACCESS_TOKEN
    WP_APP_SECRET
    WP_VERIFY_TOKEN

DATABASE_URL is the url of your web hosted database. For example, with PostgreSQL it will look like this: postgres://Username:Password@DatabaseURL:5432/DatabaseName

ORGANISATION_WP_DOMAIN is the first part of your Workplace URL, ie https://**wearecoolr**.workplace.com

WP_ACCESS_TOKEN, WP_APP_SECRET, WP_VERIFY_TOKEN are all defined when creating your integration in Workplace

## Workplace setup

### Integration permissions

The bot requires the following permissions:

- Read group content
- Manage group content
- Read all messages
- Read group membership
- Message any member - Allow this integration to work in group chats

## Webhooks

The call back URL will be your web host's URL plus /webhook . If you host on Heroku, it will look something like this https://your-wp-ooobot.herokuapp.com/webhook . The verify token you create here should be added to the WP_VERIFY_TOKEN environment variable

You will need to subscribe the integration to the following webhooks

- **Page** - messaging_postbacks - List item
- **Groups** - comments - posts

## Disclaimer

This bot is provided "as is" with no warranty or guarantee. I created it around three years ago when I was first learning about chatbots. Looking back at it, the code isn't amazing and there's a few things I'd do differently. That said, we've been using it at Coolr for about a year without any problems.

It should be noted that since I created this bot the graph API has changed a lot of the integration system has a few extra security features which I haven't incorporated. Quite a few of the permissions and webhooks have also changed so the application might be more permissive than necessary.

Please also be aware that this version of Sequelize has a [SQL injection vulnerability](https://www.npmjs.com/advisories/1018) affecting MariaDB and MySQL. I'd have to bump the package through two major releases to fix this, and I don't have time at the moment to test the impact this would have. We use PostGreSQL, so aren't impacted by this vulnerability, so I've left it "as is" for now, but will look to update it later. PRs to fix this are welcome.

# [WeAreCoolr.com](https://www.wearecoolr.com)
