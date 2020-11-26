rm -rf ./data
mkdir data

curl http://localhost/api/entries-en.json > ./data/entries-en.json
curl http://localhost/api/entries-cy.json > ./data/entries-cy.json
curl http://localhost/api/entries-ni.json > ./data/entries-ni.json

curl http://localhost/api/news-en.json > ./data/news-en.json
curl http://localhost/api/news-cy.json > ./data/news-cy.json
curl http://localhost/api/news-ni.json > ./data/news-ni.json

curl http://localhost/api/news-globals-en.json > ./data/news-globals-en.json
curl http://localhost/api/news-globals-cy.json > ./data/news-globals-cy.json
curl http://localhost/api/news-globals-ni.json > ./data/news-globals-ni.json

curl http://localhost/api/globals-en.json > ./data/globals-en.json
curl http://localhost/api/globals-cy.json > ./data/globals-cy.json
curl http://localhost/api/globals-ni.json > ./data/globals-ni.json
