# Mux Video Input Sanity Plugin

This is a plugin which lets you use MUX video assets in your studio.

# Setting up

* While in your project folder, run ``sanity install mux-input``

* Make a schema type that uses the plugin's type ``mux.video``, for example:

```
    {
      title: "Video blog post",
      name: "videoBlogPost",
      type: "document",
      fields: [
        { title: "Title", name: "title", type: "string" },
        {
          title: "Video file",
          name: "video",
          type: "mux.video"
        }
      ]
    }
```

* Get an API Access Token
The Mux Video API uses an Access Token and Secret Key for authentication.
If you haven't already, generate a new Access Token in the Access Token settings of your Mux account dashboard.

* The first time you use this plugin you will be asked to input your access token.
The token is stored in the dataset as a document of the type ``mux.apiKey`` with the id ``secrets.mux``.
Having the ID be non-root ensures that only editors are able to see it.
The MUX plugin will find it’s access tokens by fetching this document.


# Playing videos in the frontend

We have made an own player which supports poster images for the videos as set with this plugin, see [`sanity-mux-player`](https://github.com/sanity-io/sanity-mux-player)

You could use any player which supports HLS, just point the video source to:

`https://stream.mux.com/${assetDocument.playbackId}.m3u8`
