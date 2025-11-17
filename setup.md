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
2.7 update the minio env variables for the server.
3 - run the server itself using this docker command:
    docker-compose -f docker-compose.server.yml up --build -d
3.1 - create the initial admin user:
    docker-compose -f docker-compose.server.yml run --rm medusa npx medusa user -e admin@example.com -p supersecret
! replace admin@example.com and supersecret with your credentials !
3.2 login inside the console and head to settings -> Publishable API keys and create a key ig you dont have and then copy it
    mine is: pk_cc61b6d294af804895501dcc86e660e52d62d676d2b43559d42f6f2e9b6c77bb
4 - update the env file for the web
4.1 - start the web container