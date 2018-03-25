#!/usr/bin/env python
"""
This file does the following:
1. Retrieves PERSON and ORG entities from MongoDB.
2. Filters and removes duplicates from the PERSON and ORG lists.
3. Searches Twitter for each word in a list.
4. Adds the Twitter data into MongoDB.
"""

import re
import twitter
import json
import config
import datetime
from pymongo import MongoClient

db_name = 'minerva'
collection_name = 'twitter'

def get_tweets(primary_id, news_list):
    print('Getting tweets...')
    auth = twitter.oauth.OAuth(config.KEYS['TWITTER_OAUTH_TOKEN'], config.KEYS['TWITTER_OAUTH_TOKEN_SECRET'], 
                               config.KEYS['TWITTER_CONSUMER_KEY'], config.KEYS['TWITTER_CONSUMER_SECRET'])

    twitter_api = twitter.Twitter(auth=auth)
    today = datetime.datetime.now().date()
    count = 0
    
    for word in news_list:
        count += 1
        tweet = twitter_api.search.tweets(q = word, count = 10)
        add_to_db(tweet)

def get_news():
    print('Getting news from database...')
    client = MongoClient()
    db = client[db_name]
    collection = db['news']
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

def add_to_db(data):
    print('Adding tweets to database...')
    try:  
        client = MongoClient()
        db = client[db_name]
        collection = db[collection_name]
        collection.insert_one(data)
    except e:
        print(e)
        
get_news()