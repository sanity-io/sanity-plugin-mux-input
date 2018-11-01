# Mux Video Sanity Plugin


# Setting up

* Get an API Access Token
The Mux Video API uses an Access Token and Secret Key for authentication.
If you haven't already, generate a new Access Token in the Access Token settings of your Mux account dashboard.

* The first time you use this plugin you will be asked to input your access token.
The token is stored in the dataset as a document of the type ``mux.apiKey`` with the id ``secrets.mux``.
Having the ID be non-root ensures that only editors are able to see it.
The MUX plugin will find it’s access tokens by fetching this document.
