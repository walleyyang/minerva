#!/usr/bin/env python
"""
This file does the following:
1. Retrieves the current trending news in the United States with the NewsAPI.
2. Scrapes the article webpage with Beautiful Soup.
3. Uses the Natural Language Processing library Spacy to extract entities.
4. Uses GeoCoder to retrieve longitude and latitude coordinates from GeoNames.
5. Adds the data to MongoDB.
"""

import json
import re

from datetime import datetime
from bs4 import BeautifulSoup
from pymongo import MongoClient

import geocoder
import requests
import spacy
import config

def get_request(url):
    headers = {'User-Agent': 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:52.0) Gecko/20100101 Firefox/52.0'}
    request = requests.get(url, headers=headers)
    
    return request
    
def get_news():
    # Get top headines for the US
    url = "https://newsapi.org/v2/top-headlines?country=us&apiKey=" + config.KEYS['NEWS_API']
    
    request = get_request(url)
    
    if request.status_code == 200:
        data = request.text
        articles = json.loads(data)
        create_json(articles)

def article_exist(url_check, collection_name_check):
    client = MongoClient()
    db = client['news']
    collection = db[collection_name_check]
    url_count = collection.find({'url': url_check}).count()

    if url_count > 0:
        return True
    
    return False
        
def get_article(url):
    request = get_request(url)
    article = None

    if request.status_code == 200:
        data = request.text
        soup = BeautifulSoup(data, 'lxml')

        for tag in soup(['script', 'style']):
            tag.decompose()

        page = soup.get_text()

        # Strip the white space and return the lines
        lines = [line.strip() for line in page.splitlines()]

        # Remove white spaces, words that are less than 30 which are probably links or titles
        # and some special characters and common words that may be on the webpage.
        # This can probably be better.
        lines = [line for line in lines if line != '' and len(line) > 30
                 and '|' not in line and '*' not in line and ':' not in line
                 and '&' not in line and ' – ' not in line and ' - ' not in line
                 and 'Copyright' not in line and 'Subscribe' not in line
                 and 'Privacy Policy' not in line and 'Rights Reserved' not in line
                 and 'Sign in' not in line and 'Log in' not in line
                 and 'Bloomberg' not in line and 'password' not in line]

        article = ' '.join(lines)

    return article

def create_json(articles):
    nlp = spacy.load('en')
    regex = re.compile('[^a-zA-Z]')

    for article in articles['articles']:
        collection_name = regex.sub('', article['source']['name'])

        if article_exist(article['url'], collection_name) is True:
            continue

        # The GPE and LOC keys are used to retrieve latitude and longitudes from GeoNames.
        dictionary = {'insertDateTime':None, 'publishedDateTime':None, 'title':None, 'url':None,
                      'description':None, 'sourceName':None, 'coordinates':[], 'PERSON':[],
                      'NORP':[], 'FAC':[], 'ORG':[], 'GPE':[], 'LOC':[], 'PRODUCT':[], 'EVENT':[],
                      'WORK_OF_ART':[], 'LAW':[], 'LANGUAGE':[], 'DATE':[], 'TIME':[], 'PERCENT':[],
                      'MONEY':[], 'QUANTITY':[], 'ORDINAL':[], 'CARDINAL':[]}

        dictionary['insertDateTime'] = str(datetime.utcnow())
        dictionary['publishedDateTime'] = article['publishedAt']
        dictionary['title'] = article['title']
        dictionary['description'] = article['description']
        dictionary['url'] = article['url']
        dictionary['sourceName'] = article['source']['name']

        cleaned_article = get_article(article['url'])

        # We only want status code responses with 200
        if cleaned_article != None:
            nlp_article = nlp(cleaned_article)
            
            for ent in nlp_article.ents:
                if ent.label_ == 'GPE' or ent.label_ == 'LOC':
                    lat_long = geocoder.geonames(ent.text, key=config.KEYS['GEONAMES_USERNAME'])

                    if lat_long.ok is True:
                        dictionary['coordinates'].append(lat_long.latlng)
                else:
                    dictionary[ent.label_].append(ent.text)
       
            dictionary_dump = json.dumps(dictionary)
            add_to_db(collection_name, json.loads(dictionary_dump))

def add_to_db(collection_name, data):
    client = MongoClient()
    db = client['news']
    collection = db[collection_name]
    collection.insert_one(data)
      
get_news()