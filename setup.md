1 - First we have to initialize the services that work for the medusa server with this command:

    docker-compose -f docker-compose.services.yml up --build -d

2 - If you start them for the first time head to http://localhost:9002/ which is the minio console
2.1 - login and go to configuration and from there to Region and in server Location enter eu-central-1 and click save
2.2 - restart the container so the changes can take effect
2.3 - go to Access Keys and create access key
    Those are mine:
    Access key: wVfyh0kyYyUjPnliPl4k
    Secret key: E57AefvGamfVbOZVPLcgc1l6RmGgYRhNJK6qU5tY
2.4 - go to Buckets and create a new bucket named medusa-uploads
2.5 - go to the bucket and in the left pane under Administrator go to Policies and create a new policy
    Name: medusa-policy
    Write policy:
    {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Action": [
                    "s3:GetObject"
                ],
                "Resource": [
                    "arn:aws:s3:::{bucketname}/*"
                ]
            }
        ]
    }
2.6 - replace the bucketname with your buckets name for example mines medusa-uploads and save it
2.6.1 - go to Anonymous and Add Access Rule with prefix / and Access readonly
2.7 update the minio env variables for the server.
3 - run the server itself using this docker command:
    docker-compose -f docker-compose.server.yml up --build -d
3.1 - create the initial admin user:
    docker-compose -f docker-compose.server.yml run --rm medusa npx medusa user -e admin@example.com -p supersecret
! replace admin@example.com and supersecret with your credentials !
3.2 login inside the console and head to settings -> Publishable API keys and create a key ig you dont have and then copy it
    mine is: pk_cc61b6d294af804895501dcc86e660e52d62d676d2b43559d42f6f2e9b6c77bb
3.3 - setup stripe payment integration:
3.3.1 - go to https://dashboard.stripe.com/ and login
3.3.2 - click on Developers in the top right
3.3.3 - click on API keys in the left menu
3.3.4 - copy your Publishable key (starts with pk_test_) and Secret key (click Reveal test key, starts with sk_test_)
3.3.5 - add STRIPE_API_KEY to apps/backend/.env with your secret key value
3.3.6 - add STRIPE_WEBHOOK_SECRET to apps/backend/.env (optional for local development, required for production)
3.3.7 - for production webhooks: in Stripe Dashboard -> Developers -> Webhooks -> Add endpoint
    webhook url: https://your-domain.com/hooks/payment/stripe_stripe
    select events: payment_intent.amount_capturable_updated, payment_intent.succeeded, payment_intent.payment_failed, payment_intent.partially_funded
    copy the webhook signing secret (starts with whsec_)
3.3.8 - restart the medusa container:
    docker-compose -f docker-compose.server.yml restart medusa
3.3.9 - login to medusa admin at http://localhost:9000/app
3.3.10 - go to Settings -> Regions -> click your region (e.g. Bulgaria)
3.3.11 - scroll to Payment Providers section and click Add Payment Provider or Edit
3.3.12 - enable the checkbox for Stripe (pp_stripe_stripe) and click Save
4 - update the env file for the web
4.1 - make sure NEXT_PUBLIC_STRIPE_KEY in apps/web/.env has your stripe publishable key (pk_test_...)
4.2 - start the web container
    docker-compose -f docker-compose.web.yml up --build -d
4.3 - test stripe payments using test cards (use any future expiry date, any 3-digit CVC, and any ZIP code):
    4242 4242 4242 4242 - successful payment
    4000 0025 0000 3155 - requires 3D Secure authentication
    4000 0000 0000 9995 - payment declined (insufficient funds)
    4000 0000 0000 0002 - payment declined (card declined)
    4000 0000 0000 9987 - payment declined (lost card)
    5555 5555 5555 4444 - mastercard successful payment
    for more test cards visit: https://docs.stripe.com/testing