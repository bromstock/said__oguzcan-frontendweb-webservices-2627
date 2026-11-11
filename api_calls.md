# de api calls dat kunnen gedaan worden

- GET /api/builds: alle builds met minstens één component met de gebruiker die de build toegevoegd heeft
- GET /api/builds/:buildId : een build met minstens één component en de gebruiker die de build toegevoegd heeft
- POST /api/builds: build toevoegen met minstens één component
- PUT /api/builds/:buildId : build aanpassen
- DELETE /api/builds/:buildId : build verwijderen
- GET /api/builds/:buildId/components : alle components van een build ophalen
- POST /api/builds/:buildId/components/:componentId : een component toevoegen aan een build
- PUT /api/builds/:buildId/components/:componentId : een component van een build aanpassen
- DELETE /api/builds/:buildId/components/:componentId : een component van een build verwijderen
- GET /api/components : alle components opvragen
- GET /api/components/:componentId : een component opvragen
- POST /api/components: een component toevoegen
- GET /api/categories : alle categorieën opvragen
- POST /api/categories: een categorie toevoegen
- GET /api/categories/:categoriesId/components : alle componenten uit dezelfde categorie opvragen
- GET /api/builds/:buildId/categories : alle builds dat dezelfde categorie hebben van een build.
- POST /api/users: een gebruiker toevoegen
- GET /api/users/me/builds: user's builds opvragen (nog niet geïmplementeerd; vereist authenticatie)

> De huidige implementatie gebruikt tijdelijke in-memory opslag. Gegevens verdwijnen wanneer de server herstart.
