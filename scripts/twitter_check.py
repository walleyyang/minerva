import re
import twitter
import json
import config
import datetime
from pymongo import MongoClient

def get_tweets(primary_id, news_list):
    auth = twitter.oauth.OAuth(config.KEYS['TWITTER_OAUTH_TOKEN'], config.KEYS['TWITTER_OAUTH_TOKEN_SECRET'], 
                               config.KEYS['TWITTER_CONSUMER_KEY'], config.KEYS['TWITTER_CONSUMER_SECRET'])

    twitter_api = twitter.Twitter(auth=auth)
    today = datetime.datetime.now().date()
    count = 0
    
    for word in news_list:
        count += 1
        collection_name = str(primary_id) + '_' + str(count)
        tweet = twitter_api.search.tweets(q = word, count = 10)
        add_to_db(collection_name, tweet)

def get_news():
    client = MongoClient()
    db = client['news']

    for collection_name in db.collection_names():
        collection = db[collection_name]
        cursor = collection.find()
        primary_id = None
        
        # Only Person and Org are considered for this project
        for doc in cursor:
            primary_id = doc['_id']
            lists = []

            if doc['PERSON']:
                lists += filter_list(doc['PERSON'])
            
            if doc['ORG']:
                lists += filter_list(doc['ORG'])
        
            if lists:
                get_tweets(primary_id, lists)
    
def filter_list(dirty_list):
    regex = re.compile('[^a-zA-Z]')
    filtered_list = []
    
    for item in dirty_list:
        if re.match(regex, item) == None:
            filtered_list.append(item)
        
    
    return list(set(filtered_list))

def add_to_db(collection_name, data):
    try:  
        client = MongoClient()
        db = client['twitter']
        collection = db[collection_name]
        collection.insert_one(data)
    except e:
        print(e)
        
get_news()